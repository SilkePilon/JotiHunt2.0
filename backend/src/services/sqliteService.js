const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { logger } = require('../utils/logger');
const { promisify } = require('util');

const DB_PATH = path.join(process.cwd(), 'data', 'jotihunt.db');
let db = null;

/**
 * Initialize SQLite database and create tables
 */
async function initializeDatabase() {
  try {
    return new Promise((resolve, reject) => {
      db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          logger.error('Could not connect to database', err);
          return reject(err);
        }
        
        logger.info('Connected to SQLite database');
        
        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON');
        
        // Create articles table
        db.run(`
          CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            type TEXT NOT NULL,
            publish_at TEXT NOT NULL,
            content TEXT,
            points INTEGER DEFAULT NULL,
            max_points INTEGER DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
    
        // Create subscriptions table
        db.run(`
          CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            color TEXT,
            area TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
    
        // Create areas table
        db.run(`
          CREATE TABLE IF NOT EXISTS areas (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            color TEXT,
            status TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
    
        // Create assignments table for tracking user assignments
        db.run(`
          CREATE TABLE IF NOT EXISTS assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            article_id INTEGER NOT NULL,
            user_name TEXT NOT NULL,
            status TEXT DEFAULT 'Not Started',
            points_earned INTEGER DEFAULT 0,
            notes TEXT,
            assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME DEFAULT NULL,
            FOREIGN KEY (article_id) REFERENCES articles (id),
            UNIQUE(article_id, user_name)
          )
        `);
    
        // Create metadata table
        db.run(`
          CREATE TABLE IF NOT EXISTS metadata (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Create response times table for API monitoring
        db.run(`
          CREATE TABLE IF NOT EXISTS response_times (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            endpoint TEXT NOT NULL,
            response_time INTEGER NOT NULL,
            status_code INTEGER,
            success BOOLEAN NOT NULL DEFAULT 1,
            error_message TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
    
        // Create indexes for better performance
        db.serialize(() => {
          db.run(`CREATE INDEX IF NOT EXISTS idx_articles_type ON articles(type)`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_articles_publish_at ON articles(publish_at)`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_assignments_article_id ON assignments(article_id)`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_assignments_user_name ON assignments(user_name)`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_response_times_endpoint ON response_times(endpoint)`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_response_times_timestamp ON response_times(timestamp)`);
          
          logger.info('SQLite database initialized successfully');
          resolve(true);
        });
      });
    });
  } catch (error) {
    logger.error('Failed to initialize SQLite database:', error);
    throw error;
  }
}

/**
 * Insert or update articles from API data
 */
async function upsertArticles(articles) {
  try {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO articles (id, title, type, publish_at, content, points, max_points, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      
      db.serialize(() => {
        // Start a transaction
        db.run('BEGIN TRANSACTION');
        
        for (const article of articles) {
          const points = getPointsForArticle(article);
          const maxPoints = getMaxPointsForType(article.type);
          
          stmt.run(
            article.id,
            article.title,
            article.type,
            article.publish_at,
            article.message?.content || null,
            points,
            maxPoints
          );
        }
        
        // Commit the transaction
        db.run('COMMIT', (err) => {
          if (err) {
            logger.error('Error committing transaction:', err);
            db.run('ROLLBACK');
            return reject(err);
          }
          
          logger.info(`Upserted ${articles.length} articles`);
          resolve(true);
        });
      });
    });
  } catch (error) {
    logger.error('Error upserting articles:', error);
    throw error;
  }
}

/**
 * Insert or update subscriptions from API data
 */
async function upsertSubscriptions(subscriptions) {
  try {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO subscriptions (id, name, color, area, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      db.serialize(() => {
        // Start a transaction
        db.run('BEGIN TRANSACTION');
        
        for (const subscription of subscriptions) {
          stmt.run(
            subscription.id,
            subscription.name,
            subscription.color || null,
            subscription.area || null
          );
        }
        
        // Commit the transaction
        db.run('COMMIT', (err) => {
          if (err) {
            logger.error('Error committing transaction:', err);
            db.run('ROLLBACK');
            return reject(err);
          }
          
          logger.info(`Upserted ${subscriptions.length} subscriptions`);
          resolve(true);
        });
      });
    });
  } catch (error) {
    logger.error('Error upserting subscriptions:', error);
    throw error;
  }
}

/**
 * Insert or update areas from API data
 */
async function upsertAreas(areas) {
  try {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO areas (id, name, color, status, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      db.serialize(() => {
        // Start a transaction
        db.run('BEGIN TRANSACTION');
        
        for (const area of areas) {
          stmt.run(
            area.id,
            area.name,
            area.color || null,
            area.status || null
          );
        }
        
        // Commit the transaction
        db.run('COMMIT', (err) => {
          if (err) {
            logger.error('Error committing transaction:', err);
            db.run('ROLLBACK');
            return reject(err);
          }
          
          logger.info(`Upserted ${areas.length} areas`);
          resolve(true);
        });
      });
    });
  } catch (error) {
    logger.error('Error upserting areas:', error);
    throw error;
  }
}

/**
 * Get all articles with assignment information
 */
async function getArticlesWithAssignments() {
  try {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          a.*,
          COUNT(CASE WHEN assign.status = 'Completed' THEN 1 END) as completed_assignments,
          COUNT(assign.id) as total_assignments,
          GROUP_CONCAT(
            CASE WHEN assign.user_name IS NOT NULL 
            THEN assign.user_name || ':' || assign.status || ':' || COALESCE(assign.points_earned, 0)
            END, '|'
          ) as assignment_details
        FROM articles a
        LEFT JOIN assignments assign ON a.id = assign.article_id
        GROUP BY a.id
        ORDER BY a.publish_at DESC
      `, (err, rows) => {
        if (err) {
          logger.error('Error getting articles with assignments:', err);
          return reject(err);
        }
        
        // Parse assignment details
        const articles = rows.map(article => ({
          ...article,
          assignments: parseAssignmentDetails(article.assignment_details),
          progress: {
            completed: article.completed_assignments,
            total: article.total_assignments
          }
        }));
        
        resolve(articles);
      });
    });
  } catch (error) {
    logger.error('Error getting articles with assignments:', error);
    return [];
  }
}

/**
 * Get all subscriptions
 */
async function getSubscriptions() {
  try {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM subscriptions ORDER BY name', (err, rows) => {
        if (err) {
          logger.error('Error getting subscriptions:', err);
          return reject(err);
        }
        resolve(rows);
      });
    });
  } catch (error) {
    logger.error('Error getting subscriptions:', error);
    return [];
  }
}

/**
 * Get all areas
 */
async function getAreas() {
  try {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM areas ORDER BY name', (err, rows) => {
        if (err) {
          logger.error('Error getting areas:', err);
          return reject(err);
        }
        resolve(rows);
      });
    });
  } catch (error) {
    logger.error('Error getting areas:', error);
    return [];
  }
}

/**
 * Assign article to user
 */
async function assignArticle(articleId, userName, status = 'Assigned') {
  try {
    return new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO assignments (article_id, user_name, status, assigned_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `, [articleId, userName, status], function(err) {
        if (err) {
          logger.error('Error assigning article:', err);
          return reject(err);
        }
        
        logger.info(`Assigned article ${articleId} to ${userName}`);
        resolve(this.changes > 0);
      });
    });
  } catch (error) {
    logger.error('Error assigning article:', error);
    throw error;
  }
}

/**
 * Update assignment status and points
 */
async function updateAssignment(articleId, userName, status, pointsEarned = 0, notes = null) {
  try {
    return new Promise((resolve, reject) => {
      db.run(`
        UPDATE assignments 
        SET status = ?, points_earned = ?, notes = ?, 
            completed_at = CASE WHEN ? = 'Completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
        WHERE article_id = ? AND user_name = ?
      `, [status, pointsEarned, notes, status, articleId, userName], function(err) {
        if (err) {
          logger.error('Error updating assignment:', err);
          return reject(err);
        }
        
        logger.info(`Updated assignment for article ${articleId}, user ${userName}: ${status}`);
        resolve(this.changes > 0);
      });
    });
  } catch (error) {
    logger.error('Error updating assignment:', error);
    throw error;
  }
}

/**
 * Get assignments for a specific user
 */
async function getUserAssignments(userName) {
  try {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT a.*, art.title, art.type, art.max_points
        FROM assignments a
        JOIN articles art ON a.article_id = art.id
        WHERE a.user_name = ?
        ORDER BY a.assigned_at DESC
      `, [userName], (err, rows) => {
        if (err) {
          logger.error('Error getting user assignments:', err);
          return reject(err);
        }
        resolve(rows);
      });
    });
  } catch (error) {
    logger.error('Error getting user assignments:', error);
    return [];
  }
}

/**
 * Update metadata
 */
async function updateMetadata(key, value) {
  try {
    return new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO metadata (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `, [key, JSON.stringify(value)], function(err) {
        if (err) {
          logger.error('Error updating metadata:', err);
          return reject(err);
        }
        resolve(true);
      });
    });
  } catch (error) {
    logger.error('Error updating metadata:', error);
    throw error;
  }
}

/**
 * Get metadata
 */
async function getMetadata(key = null) {
  try {
    if (key) {
      return new Promise((resolve, reject) => {
        db.get('SELECT value FROM metadata WHERE key = ?', [key], (err, row) => {
          if (err) {
            logger.error('Error getting metadata:', err);
            return reject(err);
          }
          resolve(row ? JSON.parse(row.value) : null);
        });
      });
    } else {
      return new Promise((resolve, reject) => {
        db.all('SELECT key, value FROM metadata', (err, rows) => {
          if (err) {
            logger.error('Error getting metadata:', err);
            return reject(err);
          }
          
          const metadata = {};
          rows.forEach(row => {
            metadata[row.key] = JSON.parse(row.value);
          });
          resolve(metadata);
        });
      });
    }
  } catch (error) {
    logger.error('Error getting metadata:', error);
    return key ? null : {};
  }
}

/**
 * Get database statistics
 */
async function getDatabaseStats() {
  try {
    const getCount = (table) => {
      return new Promise((resolve, reject) => {
        db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
          if (err) return reject(err);
          resolve(row.count);
        });
      });
    };
    
    const [articlesCount, subscriptionsCount, areasCount, assignmentsCount] = await Promise.all([
      getCount('articles'),
      getCount('subscriptions'),
      getCount('areas'),
      getCount('assignments')
    ]);
    
    const lastUpdate = await getMetadata('lastUpdate');
    
    return {
      articlesCount,
      subscriptionsCount,
      areasCount,
      assignmentsCount,
      lastUpdate
    };
  } catch (error) {
    logger.error('Error getting database stats:', error);
    return null;
  }
}

/**
 * Helper functions
 */
function getPointsForArticle(article) {
  // Extract points from content if available
  if (article.message?.content) {
    const pointsMatch = article.message.content.match(/(\d+)\s*punt[en]?/i);
    if (pointsMatch) {
      return parseInt(pointsMatch[1]);
    }
  }
  return null;
}

function getMaxPointsForType(type) {
  switch (type.toLowerCase()) {
    case 'hint':
      return 3;
    case 'opdracht':
      return 5;
    default:
      return null;
  }
}

function parseAssignmentDetails(assignmentDetails) {
  if (!assignmentDetails) return [];
  
  return assignmentDetails.split('|')
    .filter(detail => detail && detail.trim())
    .map(detail => {
      const [userName, status, pointsEarned] = detail.split(':');
      return {
        userName,
        status,
        pointsEarned: parseInt(pointsEarned) || 0
      };
    });
}

/**
 * Store API response time
 */
async function storeResponseTime(endpoint, responseTime, statusCode = null, success = true, errorMessage = null) {
  try {
    return new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO response_times (endpoint, response_time, status_code, success, error_message, timestamp)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [endpoint, responseTime, statusCode, success, errorMessage], function(err) {
        if (err) {
          logger.error('Error storing response time:', err);
          return reject(err);
        }
        resolve(this.lastID);
      });
    });
  } catch (error) {
    logger.error('Error storing response time:', error);
    throw error;
  }
}

/**
 * Get response times for all endpoints
 */
async function getResponseTimes(limit = 100) {
  try {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          endpoint,
          response_time,
          status_code,
          success,
          error_message,
          timestamp
        FROM response_times 
        ORDER BY timestamp DESC 
        LIMIT ?
      `, [limit], (err, rows) => {
        if (err) {
          logger.error('Error getting response times:', err);
          return reject(err);
        }
        resolve(rows);
      });
    });
  } catch (error) {
    logger.error('Error getting response times:', error);
    return [];
  }
}

/**
 * Get response time statistics
 */
async function getResponseTimeStats() {
  try {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          endpoint,
          COUNT(*) as total_requests,
          AVG(response_time) as avg_response_time,
          MIN(response_time) as min_response_time,
          MAX(response_time) as max_response_time,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_requests,
          SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_requests,
          MAX(timestamp) as last_request
        FROM response_times 
        WHERE timestamp >= datetime('now', '-24 hours')
        GROUP BY endpoint
      `, (err, rows) => {
        if (err) {
          logger.error('Error getting response time stats:', err);
          return reject(err);
        }
        
        const stats = rows.map(row => ({
          ...row,
          avg_response_time: Math.round(row.avg_response_time),
          success_rate: Math.round((row.successful_requests / row.total_requests) * 100)
        }));
        
        resolve(stats);
      });
    });
  } catch (error) {
    logger.error('Error getting response time stats:', error);
    return [];
  }
}

/**
 * Clean old response time records (keep only last 7 days)
 */
async function cleanOldResponseTimes() {
  try {
    return new Promise((resolve, reject) => {
      db.run(`
        DELETE FROM response_times 
        WHERE timestamp < datetime('now', '-7 days')
      `, function(err) {
        if (err) {
          logger.error('Error cleaning old response times:', err);
          return reject(err);
        }
        
        if (this.changes > 0) {
          logger.info(`Cleaned ${this.changes} old response time records`);
        }
        resolve(this.changes);
      });
    });
  } catch (error) {
    logger.error('Error cleaning old response times:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
function closeDatabase() {
  if (db) {
    db.close();
    logger.info('Database connection closed');
  }
}

module.exports = {
  initializeDatabase,
  upsertArticles,
  upsertSubscriptions,
  upsertAreas,
  getArticlesWithAssignments,
  getSubscriptions,
  getAreas,
  assignArticle,
  updateAssignment,
  getUserAssignments,
  updateMetadata,
  getMetadata,
  getDatabaseStats,
  storeResponseTime,
  getResponseTimes,
  getResponseTimeStats,
  cleanOldResponseTimes,
  closeDatabase
};
