const pino = require('pino');
const fs = require('node:fs');
const path = require('node:path');

const logDir = path.join(__dirname, '../log');

// Crear carpeta si no existe
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const logPath = path.join(logDir, 'app.log');
const errorLogPath = path.join(logDir, 'error.log');

const logStream = fs.createWriteStream(logPath, { flags: 'a' });
const errorLogStream= fs.createWriteStream(errorLogPath, { flags: 'a' });

const logger = pino(
    {
        level: process.env.PINO_LOG_LEVEL || 'info',
        formatters: {
            level: (label) => ({ level: label.toUpperCase() })
        },
        timestamp: () => `,"timestamp":"${new Date(Date.now()).toLocaleTimeString('es-ES')} ${new Date(Date.now()).toLocaleDateString('es-ES')}"`,
    },
    pino.multistream([
        {
            level: 'info',
            stream: {
                write: (msg) => {
                    const parsedLog = JSON.parse(msg);
                    if (parsedLog.level === 'INFO' || parsedLog.level === 'WARN') {
                        logStream.write(msg);
                    }
                }
            }
        },
        {
            level: 'error',
            stream: errorLogStream
        },
        {
            level: 'debug',
            stream: pino.transport({
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'HH:MM:ss dd/mm/yyyy',
                    ignore: 'pid,hostname'
                }
            })
        }
    ])
);

module.exports = logger;