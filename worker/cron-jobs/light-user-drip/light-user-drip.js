'use strict'

/************************************************************************
 * External Dependencies
 ***********************************************************************/
const _               = require('lodash');
const axios           = require('axios');
const mongoose        = require('mongoose');

/************************************************************************
 * Internal Dependencies
 ***********************************************************************/
const config          = require('../../../server/config/config-env.js');
const logger          = require('../../../server/utils/logger.js');

const MandrillUtility = require('../../common/mandrill-utility/mandrill-utility.js');
const User            = require('../../../server/db/user/model.js');

/************************************************************************
 * Template Configurations
 ***********************************************************************/
const JOB_NAME        = 'ww-light-user-drip';
let transporter       = config.transporter;

/************************************************************************
 * Private Methods
 ***********************************************************************/
const Private = {};

Private.populateEmail = (job_name, data, success_count, error_count, error) => {
    let html_template = `<h3>Wheelwell Task Update: ${job_name}</h3><h4>Good afternoon Wheelwell! There were ${success_count} low mod score user follow-up emails sent today with ${error_count} errors:</h4><ul>`;

    _.forEach(data, user => {
        html_template += `<li><strong>${user.profile_name}</strong> (Mod Score: ${user.mod_score})</li>`;
    });

    html_template += `</ul>`;

    if (error) {
        html_template += `<p>Error finishing cursor: ${error}</p>`;
    }

    html_template += `<p><3 Your Exceptional Wheelwell Task Service</p>`;

    return html_template;
};


/************************************************************************
 * Public Export Template
 ***********************************************************************/
// MODEL KEYS: job_name, cron_time, on_tick, on_complete, start, timezone

const cron_light_user_drip_model = {
    'job_name': JOB_NAME,
    'cron_time': `00 23 12 * * *`, // Runs 12:23pm daily
    // 'cron_time': `30 * * * * *`, // Testing
    'on_tick': function(){
        logger.log('Starting light user drip email job');

        const email_summary = [];
        const today = new Date();
        const fourteen_days_ago = new Date(today.setDate(today.getDate()-15));

        let total_count = 0;
        let success_count = 0;
        let error_count = 0;
        let count = 0;

        const user_query = {
            'type': 'USER',
            'creation_timestamp': {$gte: fourteen_days_ago},
            'mod_score': {$lt: 10}
        };

        const cursor = User.find(user_query).sort({'creation_timestamp': 1}).cursor({'batchSize': 50});

        // Total Count
        return User.find(user_query).count().exec()
        .then(total_count => {
            total_count = total_count;

            // Cursor
            cursor.eachAsync(doc => {
                count++;

                doc = doc.toObject();

                const today = new Date();
                const account_creation_date = new Date(doc.creation_timestamp);
                const num_days_ago = Math.floor((today - account_creation_date)/(1000 * 60 * 60 * 24));
                const email_data = {};


                if (num_days_ago === 14) {
                    logger.debug('=======================================================');
                    logger.info(`#${count} of ${total_count}: ${doc._id} ${doc.local.username} - Modscore ${doc.mod_score} ${account_creation_date.toLocaleDateString()}`);

                    // Populate email data
                    email_data.to = doc.local.username || (doc.facebook ? doc.facebook.email : null);
                    email_data.tags = ['light-user'];
                    email_data.template_slug = 'low-mod-score-users-email';
                    email_data.template_name = 'low mod score users email subj: how many mods';
                    email_data.ga_campaign = 'light-user-drip';
                    email_data.global_merge_vars = [
                        {
                            "name": "user_info",
                            "content": MandrillUtility.populateUserInfo(doc)
                        }
                    ];

                    // Send Mandrill Email
                    return MandrillUtility.sendMandrillEmail(email_data)
                    .then(result => {
                        success_count++;
                        email_summary.push({
                            'profile_name': doc.profile_name,
                            'mod_score':  doc.mod_score
                        });

                        logger.info(`Successfully sent email to ${doc.name} ${doc._id}`);
                    })
                    .catch(error => {
                        error_count++;
                        logger.info(`Error sending email to ${doc.name} ${doc._id}:\n ${error}`);
                    })
                }
            })
            .then(() => {
                logger.info(`Done with cursor - sending ${success_count} or ${total_count} emails with ${error_count}`);

                let mail_options = {
                    'from': `"Wheelwell Task Service" <${config.mail_user}>`,
                    'to': (config.env === 'production') ? config.prod_email_list : config.dev_email_list,
                    'subject': `${new Date().toLocaleDateString()} - Job Update <${JOB_NAME} - ${config.env}>`,
                    'html': Private.populateEmail(JOB_NAME, email_summary, success_count, error_count)
                };

                // Send summary email
                transporter.sendMail(mail_options, (error, info) => {
                    if (error) return logger.error(`Error sending summary email for job ${JOB_NAME} \n\n${error}`);

                    logger.info(`Summary email sent successfully for job ${JOB_NAME}`);
                });
            })
            .catch(error => {
                logger.info(`Error finishing cursor. Total Count: ${total_count}, ${error}`);

                // Send error email
                let mail_options = {
                    'from': `"Wheelwell Task Service" <${config.mail_user}>`,
                    'to': (config.env === 'production') ? config.prod_email_list : config.dev_email_list,
                    'subject': `${new Date().toLocaleDateString()} - Job Update <${JOB_NAME} - ${config.env}>`,
                    'html': Private.populateEmail(JOB_NAME, email_summary, success_count, error_count, error)
                };

                transporter.sendMail(mail_options, (error, info) => {
                    if (error) return logger.error(`Error sending error email for job ${JOB_NAME} from: \n\n${error}`);

                    logger.info(`Error email sent successfully for job ${JOB_NAME}`);
                });
            })
        })

    },
    'on_complete': function(){
        console.log('Done with script!');
    },
    'start': false,
    'timezone': 'America/Los_Angeles'
};

module.exports = cron_light_user_drip_model;
