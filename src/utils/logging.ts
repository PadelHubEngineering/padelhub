
import winston, { format } from 'winston';
import expressWinston from "express-winston"

const { combine, timestamp } = format;

const terminalFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

const default_transports = [
    new winston.transports.Console({
        format: combine( timestamp(), terminalFormat ),
    }),
    new winston.transports.File({
        filename: 'error.log',
        level: 'error',
        format: combine( timestamp(), winston.format.json() )
    }),
    new winston.transports.File({
        filename: 'combined.log',
        format: combine( timestamp(), winston.format.json() )
    }),
]

export const logger = winston.createLogger({
    level: process.env.RUN_MODE === 'development' ? 'debug' : 'info',
    defaultMeta: { service: 'padelHub' },
    transports: default_transports,
});

export const expressLogger = expressWinston.logger({
    transports: default_transports,
    meta: true,
    msg: "", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
    expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
    colorize: true, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
})
