type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
    [key: string]: unknown;
}

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    data?: LogContext;
    error?: {
        message: string;
        stack?: string;
        name?: string;
    };
}

const isDevelopment = process.env.NODE_ENV === 'development';

// Couleurs pour la console en développement
const colors = {
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m', // Green
    warn: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    reset: '\x1b[0m',
};

// Préfixes pour chaque niveau
const prefixes = {
    debug: '🐛 DEBUG',
    info: 'ℹ️  INFO',
    warn: '⚠️  WARN',
    error: '❌ ERROR',
};

function formatLogEntry(entry: LogEntry): string {
    if (isDevelopment) {
        // Format lisible en développement
        const color = colors[entry.level];
        const prefix = prefixes[entry.level];
        const timestamp = new Date(entry.timestamp).toLocaleTimeString('fr-FR');

        let output = `${color}${prefix}${colors.reset} [${timestamp}] ${entry.message}`;

        if (entry.error) {
            output += `\n${color}Error:${colors.reset} ${entry.error.message}`;
            if (entry.error.stack) {
                output += `\n${entry.error.stack}`;
            }
        }

        if (entry.data && Object.keys(entry.data).length > 0) {
            output += `\n${color}Data:${colors.reset} ${JSON.stringify(entry.data, null, 2)}`;
        }

        return output;
    } else {
        // Format JSON structuré en production
        return JSON.stringify(entry);
    }
}

function log(level: LogLevel, message: string, dataOrError?: LogContext | Error): void {
    const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
    };

    // Gérer les erreurs
    if (dataOrError instanceof Error) {
        entry.error = {
            message: dataOrError.message,
            stack: dataOrError.stack,
            name: dataOrError.name,
        };
    } else if (dataOrError) {
        entry.data = dataOrError;
    }

    // En production, ne pas afficher debug et info
    if (!isDevelopment && (level === 'debug' || level === 'info')) {
        return;
    }

    const formatted = formatLogEntry(entry);

    // Utiliser la méthode console appropriée
    switch (level) {
        case 'debug':
            console.debug(formatted);
            break;
        case 'info':
            console.info(formatted);
            break;
        case 'warn':
            console.warn(formatted);
            break;
        case 'error':
            console.error(formatted);
            break;
    }
}

export const logger = {
    debug: (message: string, data?: LogContext) => {
        log('debug', message, data);
    },

    info: (message: string, data?: LogContext) => {
        log('info', message, data);
    },

    warn: (message: string, data?: LogContext) => {
        log('warn', message, data);
    },

    error: (message: string, errorOrData?: Error | LogContext) => {
        log('error', message, errorOrData);
    },
};

