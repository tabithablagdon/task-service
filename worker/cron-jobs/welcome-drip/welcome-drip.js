'use strict'

/************************************************************************
 * External Dependencies
 ***********************************************************************/
const _                 = require('lodash');
const axios             = require('axios');
const chalk             = require('chalk');
const mongoose          = require('mongoose');

/************************************************************************
 * Internal Dependencies
 ***********************************************************************/
const config            = require('../../../server/config/config-env.js');
const logger            = require('../../../server/utils/logger.js');

const MandrillUtility   = require('../../common/mandrill-utility/mandrill-utility.js');
const User              = require('../../../server/db/user/model.js');
const WELCOME_DRIP_DATA = require('./data/welcome-drip-data.js');

/************************************************************************
 * Template Configurations
 ***********************************************************************/
const JOB_NAME          = 'ww-welcome-drip';
let transporter         = config.transporter;

/************************************************************************
 * Private Methods
 ***********************************************************************/

const Private = {};

Private.populateEmail = (job_name, data, error) => {
    let html_template = `<h3>Wheelwell Task Update: ${job_name}</h3><h4>Top of the morning Wheelwell team! Here's your daily update on welcome drip emails sent:</h4>`;

    _.forEach(Object.keys(data), email_name => {
        html_template += `<strong><p>${email_name} - ${data[email_name].length} Emails Sent</p></strong><ul>`;

        _.forEach(data[email_name], profile_name => {
            html_template += `<li>${profile_name}</li>`;
        });

        html_template += '</ul>';
    });

    if (error) {
        html_template += `<p>Error finishing cursor: ${error}</p>`;
    }

    html_template += `<p><3 Your Ridiculously Good Looking Wheelwell Task Service</p>`;

    return html_template;
};


/************************************************************************
 * Public Export Template
 ***********************************************************************/
// MODEL KEYS: job_name, cron_time, on_tick, on_complete, start, timezone

const cron_welcome_drip = {
    'job_name': JOB_NAME,
    'cron_time': `00 23 7 * * *`, // Runs 7:23am daily
    // 'cron_time': `30 * * * * *`, // Testing
    'on_tick': function(){
        const email_summary = {};
        const today = new Date();
        const days_ago = new Date(today.setDate(today.getDate()-18));

        let success_count = 0;
        let error_count = 0;
        let count = 0;

        const user_query = {
            'type': 'USER',
            'creation_timestamp': {$gte: days_ago},
        };

        const cursor = User.find(user_query).sort({'creation_timestamp': 1}).cursor({'batchSize': 50});

        // Iterate through each user and send email
        return cursor.eachAsync(doc => {
            count++;

            doc = doc.toObject();

            const today = new Date();
            const account_creation_date = new Date(doc.creation_timestamp);
            const num_days_ago = Math.floor((today - account_creation_date)/(1000 * 60 * 60 * 24));
            const email_data = {};

            // Only send drip email if account created a certain number of days ago
            if (WELCOME_DRIP_DATA.hasOwnProperty(num_days_ago)) {
                let email_template = WELCOME_DRIP_DATA[num_days_ago]['template_slug']

                if (success_count % 10 === 0) {
                    logger.info('=======================================================');
                    logger.info(`${email_template} #${success_count}: ${doc._id} ${doc.local.username} -  ${account_creation_date.toLocaleDateString()}`);
                }

                // Populate email data
                // email_data.to = 'tabitha@wheelwell.com'; // testing
                email_data.to = doc.local.username || (doc.facebook ? doc.facebook.email : null);
                email_data.tags = WELCOME_DRIP_DATA[num_days_ago]['tags'];
                email_data.template_slug = email_template;
                email_data.template_name = WELCOME_DRIP_DATA[num_days_ago]['template_name'];
                email_data.ga_campaign = WELCOME_DRIP_DATA[num_days_ago]['ga_campaign'];
                email_data.global_merge_vars = [
                    {
                        'name': 'user_info',
                        'content': MandrillUtility.populateUserInfo(doc)
                    }
                ];

                // Send Mandrill Email
                return MandrillUtility.sendMandrillEmail(email_data)
                .then(result => {
                    if (success_count % 10 === 0) {
                        logger.info(`Successfully sent ${email_template} email to ${doc.name} ${doc._id}`);
                    }

                    success_count++;

                    // Populate email summary data
                    if (!email_summary.hasOwnProperty(email_template)) {
                        email_summary[email_template] = []
                    }

                    email_summary[email_template].push(doc.profile_name);
                })
                .catch(error => {
                    error_count++;
                    logger.error(`Error sending ${email_template} email to ${doc.name} ${doc._id}:\n ${error}`);
                });
            }
        })
        .then(() => {
            logger.info(`Done with email cursor. Sent ${success_count} emails with ${error_count} errors`);

            let mail_options = {
                'from': `"Wheelwell Task Service" <${config.mail_user}>`,
                'to': (config.env === 'production') ? config.prod_email_list : config.dev_email_list,
                'subject': `${new Date().toLocaleDateString()} - Job Update <${JOB_NAME} - ${config.env}>`,
                'html': Private.populateEmail(JOB_NAME, email_summary)
            };

            // Send summary email
            transporter.sendMail(mail_options, (error, info) => {
                if (error) return logger.error(`Error sending summary email for job ${JOB_NAME} \n\n${error}`);

                logger.info(`Summary email sent successfully for job ${JOB_NAME}`);
            });

        })
        .catch(error => {
            logger.error(`Error finishing ${email_name} email cursor. ${error}`);

            // Send error email
            let mail_options = {
                'from': `"Wheelwell Task Service" <${config.mail_user}>`,
                'to': (config.env === 'production') ? config.prod_email_list : config.dev_email_list,
                'subject': `${new Date().toLocaleDateString()} - Job Update <${JOB_NAME} - ${config.env}>`,
                'html': Private.populateEmail(JOB_NAME, email_summary, error)
            };

            transporter.sendMail(mail_options, (error, info) => {
                if (error) return logger.error(chalk.bgRed(`Error sending error email for job ${JOB_NAME} from: \n\n${error}`));

                logger.error(`Error email sent successfully for job ${JOB_NAME}`);
            });
        });

    },
    'on_complete': function(){
        logger.log('Done with script!');
    },
    'start': false,
    'timezone': 'America/Los_Angeles'
};

module.exports = cron_welcome_drip;
