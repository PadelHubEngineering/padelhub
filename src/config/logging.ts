
import winston from 'winston';
import expressWinston from "express-winston"
import config from "./general.config"

const default_format = winston.format.combine(
    winston.format.json(),
    winston.format.colorize()
)

export const logger = winston.createLogger({
    level: config.env === 'development' ? 'debug' : 'info',
    format: default_format,
    defaultMeta: { service: 'padelHub' },
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

export const expressLogger = expressWinston.logger({
    transports: [
        new winston.transports.Console()
    ],
    format: default_format,
    meta: true,
    msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
    expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
    colorize: true, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
})
