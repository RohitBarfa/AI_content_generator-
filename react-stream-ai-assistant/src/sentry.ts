import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

/**
 * Initialize Sentry for error monitoring and performance tracking
 * Only initializes if VITE_SENTRY_DSN environment variable is provided
 */
export const initializeSentry = () => {
    const dsn = import.meta.env.VITE_SENTRY_DSN;

    if (!dsn) {
        console.log('Sentry DSN not provided. Skipping Sentry initialization.');
        return;
    }

    try {
        Sentry.init({
            dsn,
            environment: import.meta.env.MODE || 'development',
            integrations: [
                new BrowserTracing({
                    // Set sampling rate for performance monitoring
                    // In production, you might want to reduce this
                    tracePropagationTargets: ['localhost', /^https:\/\/yourapi\.domain\.com\/api/],
                }),
            ],
            // Performance Monitoring
            tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
            // Session Replay
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0,

            beforeSend(event) {
                // Filter out development/localhost errors if needed
                if (import.meta.env.MODE === 'development') {
                    console.log('Sentry captured event:', event);
                }
                return event;
            },
        });

        console.log('✅ Sentry initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize Sentry:', error);
    }
};

// Export utility functions for manual error tracking
export const captureError = (error: Error, context?: Record<string, any>) => {
    Sentry.withScope((scope) => {
        if (context) {
            Object.keys(context).forEach(key => {
                scope.setContext(key, context[key]);
            });
        }
        Sentry.captureException(error);
    });
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
    Sentry.captureMessage(message, level);
};

// React Error Boundary component
export const SentryErrorBoundary = Sentry.ErrorBoundary;