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

// ============================================
// UTILITAIRES DE MASQUAGE (SÉCURITÉ)
// ============================================

/**
 * Masque un email pour les logs
 * Exemple: "jean.dupont@example.com" → "j***@e***.com"
 */
export function maskEmail(email: string | null | undefined): string {
    if (!email) return '[aucun]';
    
    const parts = email.split('@');
    if (parts.length !== 2) return '[email-invalide]';
    
    const [localPart, domain] = parts;
    const domainParts = domain.split('.');
    
    // Masquer la partie locale (garder 1er caractère)
    const maskedLocal = localPart.length > 1 
        ? localPart[0] + '***' 
        : '*';
    
    // Masquer le domaine (garder 1er caractère + extension)
    const maskedDomain = domainParts.length > 1
        ? domainParts[0][0] + '***.' + domainParts[domainParts.length - 1]
        : '***';
    
    return `${maskedLocal}@${maskedDomain}`;
}

/**
 * Masque un numéro de téléphone pour les logs
 * Exemple: "0612345678" → "06***78"
 */
export function maskPhone(phone: string | null | undefined): string {
    if (!phone) return '[aucun]';
    const cleaned = phone.replace(/\s/g, '');
    if (cleaned.length < 4) return '***';
    return cleaned.slice(0, 2) + '***' + cleaned.slice(-2);
}

/**
 * Nettoie un objet de contexte pour retirer/masquer les données sensibles
 */
export function sanitizeLogData(data: LogContext): LogContext {
    const sanitized: LogContext = {};
    
    for (const [key, value] of Object.entries(data)) {
        const keyLower = key.toLowerCase();
        
        // Masquer les emails
        if (keyLower.includes('email')) {
            sanitized[key] = typeof value === 'string' ? maskEmail(value) : '[masqué]';
        }
        // Masquer les téléphones
        else if (keyLower.includes('phone') || keyLower.includes('tel')) {
            sanitized[key] = typeof value === 'string' ? maskPhone(value) : '[masqué]';
        }
        // Masquer les mots de passe (ne devrait jamais arriver, mais sécurité)
        else if (keyLower.includes('password') || keyLower.includes('secret') || keyLower.includes('token')) {
            sanitized[key] = '[MASQUÉ]';
        }
        // Garder les autres valeurs
        else {
            sanitized[key] = value;
        }
    }
    
    return sanitized;
}

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
        // SÉCURITÉ: Masquer automatiquement les données sensibles
        entry.data = sanitizeLogData(dataOrError);
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

