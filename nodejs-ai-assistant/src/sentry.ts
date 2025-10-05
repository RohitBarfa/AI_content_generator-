import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import express from 'express';
import logger from './logger';

// Sentry configuration
export const initializeSentry = (app: express.Application) => {
    const dsn = process.env.SENTRY_DSN;

    if (!dsn) {
        logger.info('Sentry DSN not provided. Skipping Sentry initialization.');
        return;
    }

    try {
        Sentry.init({
            dsn,
            environment: process.env.NODE_ENV || 'development',
            // Performance Monitoring
            tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
            // Profiling
            profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
            integrations: [
                // Add profiling integration
                nodeProfilingIntegration(),
            ],
            // Capture unhandled promise rejections
        });

        logger.info('Sentry initialized successfully (basic setup)');
    } catch (error) {
        logger.error('Failed to initialize Sentry:', error);
    }
};

// Error handler utility (simplified)
export const sentryErrorHandler = () => {
    return (err: any, req: any, res: any, next: any) => {
        // Capture error manually and pass through
        Sentry.captureException(err);
        next(err);
    };
};

// Manual error capture utility
export const captureException = (error: Error, context?: any) => {
    if (context) {
        Sentry.withScope((scope) => {
            scope.setContext('additional', context);
            Sentry.captureException(error);
        });
    } else {
        Sentry.captureException(error);
    }

    // Also log to our winston logger
    logger.error('Exception captured:', { error: error.message, stack: error.stack, context });
};

// Manual message capture utility
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info', extra?: any) => {
    Sentry.withScope((scope) => {
        if (extra) {
            scope.setExtra('data', extra);
        }
        Sentry.captureMessage(message, level);
    });

    // Also log to our winston logger
    logger.info('Message captured:', { message, extra });
};

export default Sentry;