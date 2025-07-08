const fs = require('fs-extra');
const path = require('path');
const { logger } = require('../utils/logger');

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILES = {
  articles: path.join(DB_DIR, 'articles.json'),
  subscriptions: path.join(DB_DIR, 'subscriptions.json'),
  areas: path.join(DB_DIR, 'areas.json'),
  metadata: path.join(DB_DIR, 'metadata.json')
};

/**
 * Initialize database directory and files
 */
async function initializeDatabase() {
  try {
    // Ensure data directory exists
    await fs.ensureDir(DB_DIR);
    
    // Initialize empty files if they don't exist
    for (const [key, filePath] of Object.entries(DB_FILES)) {
      if (!(await fs.pathExists(filePath))) {
        const initialData = key === 'metadata' 
          ? { lastUpdate: null, version: '1.0.0' }
          : { data: [], lastUpdate: null };
        
        await fs.writeJson(filePath, initialData, { spaces: 2 });
        logger.info(`Initialized database file: ${key}.json`);
      }
    }
    
    logger.info('Database initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Read data from a specific table
 */
async function readTable(tableName) {
  try {
    const filePath = DB_FILES[tableName];
    if (!filePath) {
      throw new Error(`Unknown table: ${tableName}`);
    }

    if (!(await fs.pathExists(filePath))) {
      logger.warn(`Database file not found: ${tableName}.json`);
      return null;
    }

    const data = await fs.readJson(filePath);
    return data;
  } catch (error) {
    logger.error(`Error reading table ${tableName}:`, error);
    return null;
  }
}

/**
 * Write data to a specific table
 */
async function writeTable(tableName, data) {
  try {
    const filePath = DB_FILES[tableName];
    if (!filePath) {
      throw new Error(`Unknown table: ${tableName}`);
    }

    const tableData = {
      data: data,
      lastUpdate: new Date().toISOString()
    };

    await fs.writeJson(filePath, tableData, { spaces: 2 });
    logger.info(`Updated database table: ${tableName}`);
    return true;
  } catch (error) {
    logger.error(`Error writing table ${tableName}:`, error);
    throw error;
  }
}

/**
 * Get data from a table (returns just the data array)
 */
async function getData(tableName) {
  const tableData = await readTable(tableName);
  return tableData?.data || [];
}

/**
 * Update metadata
 */
async function updateMetadata(metadata) {
  try {
    const currentMetadata = await readTable('metadata') || {};
    const updatedMetadata = {
      ...currentMetadata,
      ...metadata,
      lastUpdate: new Date().toISOString()
    };

    await fs.writeJson(DB_FILES.metadata, updatedMetadata, { spaces: 2 });
    logger.info('Metadata updated');
    return updatedMetadata;
  } catch (error) {
    logger.error('Error updating metadata:', error);
    throw error;
  }
}

/**
 * Get metadata
 */
async function getMetadata() {
  return await readTable('metadata');
}

/**
 * Get database status and statistics
 */
async function getDatabaseStatus() {
  try {
    const status = {
      initialized: await fs.pathExists(DB_DIR),
      tables: {},
      totalRecords: 0,
      lastUpdate: null
    };

    for (const tableName of ['articles', 'subscriptions', 'areas']) {
      const tableData = await readTable(tableName);
      const recordCount = Array.isArray(tableData?.data) ? tableData.data.length : 0;
      
      status.tables[tableName] = {
        exists: tableData !== null,
        records: recordCount,
        lastUpdate: tableData?.lastUpdate
      };
      
      if (Array.isArray(tableData?.data)) {
        status.totalRecords += recordCount;
      }
    }

    const metadata = await getMetadata();
    status.lastUpdate = metadata?.lastUpdate;

    return status;
  } catch (error) {
    logger.error('Error getting database status:', error);
    return null;
  }
}

/**
 * Backup database
 */
async function backupDatabase() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(DB_DIR, 'backups', timestamp);
    
    await fs.ensureDir(backupDir);
    
    for (const [tableName, filePath] of Object.entries(DB_FILES)) {
      if (await fs.pathExists(filePath)) {
        const backupPath = path.join(backupDir, `${tableName}.json`);
        await fs.copy(filePath, backupPath);
      }
    }
    
    logger.info(`Database backed up to: ${backupDir}`);
    return backupDir;
  } catch (error) {
    logger.error('Error backing up database:', error);
    throw error;
  }
}

/**
 * Clean old backups (keep only last 5)
 */
async function cleanOldBackups() {
  try {
    const backupsDir = path.join(DB_DIR, 'backups');
    
    if (!(await fs.pathExists(backupsDir))) {
      return;
    }
    
    const backups = await fs.readdir(backupsDir);
    const sortedBackups = backups
      .filter(name => fs.statSync(path.join(backupsDir, name)).isDirectory())
      .sort()
      .reverse();
    
    if (sortedBackups.length > 5) {
      const toDelete = sortedBackups.slice(5);
      
      for (const backup of toDelete) {
        await fs.remove(path.join(backupsDir, backup));
        logger.info(`Removed old backup: ${backup}`);
      }
    }
  } catch (error) {
    logger.error('Error cleaning old backups:', error);
  }
}

module.exports = {
  initializeDatabase,
  readTable,
  writeTable,
  getData,
  updateMetadata,
  getMetadata,
  getDatabaseStatus,
  backupDatabase,
  cleanOldBackups
};
