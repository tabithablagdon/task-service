'use strict'

/************************************************************************
 * External Dependencies
 ***********************************************************************/
const express    = require('express');
const bodyParser = require('body-parser');
const morgan     = require('morgan');

/************************************************************************
 * Internal Dependencies
 ***********************************************************************/
const env        = require('./config-env.js');
const logger     = require('../utils/logger');
/************************************************************************
 * Public Export
 ***********************************************************************/
module.exports = (app) => {
    app.set('env', env.env);
    app.set('port', env.port);
    app.set('database_uri', env.database_uri);

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: false}));

    // Separate error vs. success logs
    app.use(morgan(env.env === 'production' ? 'common' : 'dev', {
        skip: function (req, res) {
            return res.statusCode < 400
        },
        stream: logger.stream
    }));

    app.use(morgan(env.env === 'production' ? 'common' : 'dev', {
        skip: function (req, res) {
            return res.statusCode >= 400
        },
        stream: logger.stream
    }));
};
