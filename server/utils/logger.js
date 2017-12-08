'use strict'

/************************************************************************
 * External Dependencies
 ***********************************************************************/
const CloudWatchTransport = require('winston-aws-cloudwatch');
const winston             = require('winston');

winston.emitErrs          = true;

/************************************************************************
 * Internal Dependencies
 ***********************************************************************/
const config              = require('../config/config-env');

/************************************************************************
 * Module
 ***********************************************************************/
const tsFormat = () => `[${(new Date()).toLocaleDateString()} ${(new Date()).toLocaleTimeString()}]`;

const logger = new winston.Logger({
    transports: [
        new winston.transports.File({
            name: 'info-file',
            level: 'info',
            filename: './server/logs/filelog-info.log',
            handleExceptions: true,
            humanReadableUnhandledException: true,
            json: true,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            colorize: false

        }),
        new winston.transports.File({
            name: 'error-file',
            level: 'error',
            filename: './server/logs/filelog-error.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            colorize: false

        }),
        new winston.transports.Console({
            level: 'debug',
            handleExceptions: true,
            json: false,
            timestamp: tsFormat,
            colorize: true
        })
    ],
    exitOnError: false
});

var cloudwatchConfig = {
    logGroupName: 'ww-taskservice-prod-logs',
    logStreamName: 'production',
    createLogGroup: false,
    createLogStream: true,
    awsConfig: {
        accessKeyId: process.env.aws_access_key
        secretAccessKey: process.env.aws_secret_key
        region: process.env.aws_region
    },
    formatLog: function (item) {
        return item.level + ': ' + item.message + ' ' + JSON.stringify(item.meta);
    }
};

if (config.env === 'production') logger.add(CloudWatchTransport, cloudwatchConfig);

logger.stream = {
    write: function(message, encoding) {
        logger.info(message);
    }
};

/************************************************************************
 * Public Export
 ***********************************************************************/
module.exports = logger;
