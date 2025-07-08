/**
 * Simple logger utility
 */
class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ') : '';
    
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedArgs}`;
  }

  info(message, ...args) {
    console.log(this.formatMessage('info', message, ...args));
  }

  warn(message, ...args) {
    console.warn(this.formatMessage('warn', message, ...args));
  }

  error(message, ...args) {
    console.error(this.formatMessage('error', message, ...args));
  }

  debug(message, ...args) {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, ...args));
    }
  }
}

const logger = new Logger();

module.exports = { logger };
