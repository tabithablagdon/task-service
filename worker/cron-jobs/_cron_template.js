'use strict'

/************************************************************************
 * External Dependencies
 ***********************************************************************/
const _        = require('lodash');
const mongoose = require('mongoose');

/************************************************************************
 * Internal Dependencies
 ***********************************************************************/
const config   = require('../../../server/config/config-env.js');
const logger   = require('../../../server/utils/logger.js');

/************************************************************************
 * Model Configurations
 ***********************************************************************/
const JOB_NAME  = 'test'; // insert name of job here <required>

/************************************************************************
 * Private Methods
 ***********************************************************************/
const Private = {};

/************************************************************************
 * Public Export Template
 ***********************************************************************/
// MODEL KEYS: job_name, cron_time, on_tick, on_complete, start, timezone

const cron_model = {
    'job_name': JOB_NAME, // Don't change - change JOB_NAME constant above
    'cron_time': '', // insert cron_time string here, ie '* * * * * *' <required>
    'on_tick': function(){
        // function to run on cron job start <required>
    },
    'on_complete': function(){
        // function to run when .stop() is called on job <optional>
    },
    'start': false,
    'timezone': 'America/Los_Angeles'
};

module.exports = cron_model;
