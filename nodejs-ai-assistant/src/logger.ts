import winston from 'winston';

// Define log levels and colors
const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const logColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

// Add colors to winston
winston.addColors(logColors);

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

// Define which transports the logger must use
const transports = [
    // Console transport
    new winston.transports.Console({
        format: logFormat,
    }),
    // File transport for errors
    new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
    }),
    // File transport for all logs
    new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
    }),
];

// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
    levels: logLevels,
    transports,
    // Don't exit on handled exceptions
    exitOnError: false,
});

// Create logs directory if it doesn't exist (for development)
import { mkdirSync } from 'fs';
import { dirname } from 'path';

try {
    mkdirSync(dirname('logs/error.log'), { recursive: true });
} catch (error) {
    // Directory might already exist, ignore error
}

// Stream object for morgan HTTP request logging
export const morganStream = {
    write: (message: string) => {
        logger.http(message.trim());
    },
};

// Export logger
export default logger;