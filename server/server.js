'use strict'

/************************************************************************
 * External Dependencies
 ***********************************************************************/
const express      = require('express');
const mongoose     = require('mongoose');

/************************************************************************
 * Internal Dependencies
 ***********************************************************************/
const configServer = require('./config/config-server');
const configRoutes = require('./config/config-routes');
const logger       = require('./utils/logger');
const Worker       = require('../worker');

/************************************************************************
 * Jobs
 ***********************************************************************/
const ww_abandoned_users     = require('../worker/cron-jobs/abandoned-users/abandoned-users.js');
const ww_light_user_drip     = require('../worker/cron-jobs/light-user-drip/light-user-drip.js');
const ww_weekly_digest       = require('../worker/cron-jobs/weekly-digest/weekly-digest.js');
const ww_welcome_drip        = require('../worker/cron-jobs/welcome-drip/welcome-drip.js');

/************************************************************************
 * Configurations
 ***********************************************************************/
const app = express();

configServer(app);
configRoutes(app);

/************************************************************************
 * Add Jobs to Worker
 ***********************************************************************/
// Only run these jobs below if in production environment
if (app.get('env') === 'production') {
    Worker.addJob(ww_abandoned_users);
    Worker.addJob(ww_light_user_drip);
    Worker.addJob(ww_weekly_digest);
    Worker.addJob(ww_welcome_drip);
}


/************************************************************************
 * Connect to Database and Server
 ***********************************************************************/
const mongo_options = {
    'replSet': {
        'socketOptions': {
            'connectTimeoutMS': app.get('db_timeout')
        }
    },
    'server': {
        'socketOptions': {
            'connectTimeoutMS': app.get('db_timeout')
        }
    }
};

mongoose.connect(process.env.DATABASE_URI || 'mongodb://localhost/wheelwell', mongo_options)
.then(response => {
    mongoose.connection.on('error', logger.error.bind(logger, 'Database connection error:'))
    logger.debug(`Connected to WW API database in ${app.get('env')} mode`);

    app.listen(app.get('port'), () => {
        logger.info(`Listening on port ${app.get('port')}`);

        // Run all cron jobs
        Worker.runAllJobs();
    });
})
.catch(error => {
    logger.error(`Failed to connect to MongoDB with error: ${error} ${error.stack}`);
});

/************************************************************************
 * Public Export
 ***********************************************************************/
module.exports = app;
