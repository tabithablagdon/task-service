'use strict'

/************************************************************************
 * External Dependencies
 ***********************************************************************/
const mandrill         = require('mandrill-api/mandrill');
const mongoose         = require('mongoose');

/************************************************************************
 * Internal Dependencies
 ***********************************************************************/
const config           = require('../../../server/config/config-env.js');
const logger           = require('../../../server/utils/logger.js');

// Data Models =========================================================
const Leads            = require('../../../server/db/leads/model.js');

/************************************************************************
 * Model Configurations
 ***********************************************************************/
const JOB_NAME         = 'ww-abandoned-users';
const mandrill_client  = new mandrill.Mandrill(config.mandrill_api_key);
const transporter      = config.transporter;

/************************************************************************
 * Private Methods
 ***********************************************************************/
const Private = {};

Private.sendMandrillAbandonedUsersEmail = (to_email, subject, send_at) => new Promise((resolve, reject) => {
    if (!to_email) reject('No email');

    const message = {
        "from_email": "info@wheelwell.com",
        "from_name": "Wheelwell",
        "to": [{
                "email": to_email,
                "name": null,
                "type": "to"
        }],
        "headers": {
            "Reply-To": "info@wheelwell.com"
        },
        "important": false,
        "track_opens": true,
        "track_clicks": true,
        "auto_text": null,
        "auto_html": null,
        "inline_css": true,
        "url_strip_qs": null,
        "preserve_recipients": null,
        "view_content_link": null,
        "tracking_domain": 'mandrill.wheelwell.com',
        "signing_domain": 'wheelwell.com',
        "return_path_domain": null,
        "merge": true,
        "merge_language": "handlebars",
        "global_merge_vars": [],

        "google_analytics_domains": [
            "wheelwell.com",
            "www.wheelwell.com",
        ],
        "metadata": {
            "website": "wheelwell.com"
        },
    };

    if (subject) message.subject = subject;
    message.tags = ['abandoned-users'];
    message.google_analytics_campaign = 'abandoned-users';

    let template = {
        "template_slug": 'abandoned-users',
        "template_name": 'Abandoned Users',
        "template_content": [],
        "message": message,
        "async": false,
    };

    if (send_at) template.send_at = send_at;

    mandrill_client.messages.sendTemplate(template,
    (result) => {
        resolve(result);
    },
    (error) => {
        logger.error('A mandrill error occurred: \n' + error.name + ' - ' + error.message);
        resolve({message: "Error sending email.", key: 'EMAIL_ERROR', code: 500});
    });
});

// Populate email template
Private.populateEmail = (job_name, summary_data, total_leads, total_sent, error_count, error) => {
    let html_template = `
        <h3>Wheelwell job Update: ${job_name}</h3>
        <p>Yo stud!</p>
        <p><strong>${total_leads}</strong> people didn't complete desktop signup yesterday. Finished sending <strong>${total_sent}</strong> abandoned users follow-up emails with <strong>${error_count}</strong> errors. Emails sent to:</p>
        <ol>
    `;
    summary_data.forEach(email => {
        html_template += `<li>${email}</li>`
    });

    html_template += '</ol>';

    if (error) {
        html_template += `<p>Error finishing cursor: ${error}</p>`;
    }

    html_template += `<3 <p>Your Amazing Wheelwell Task Service</p>`;

    return html_template;
};

/************************************************************************
 * Public Export Template
 ***********************************************************************/
// MODEL KEYS: job_name, cron_time, on_tick, on_complete, start, timezone

const cron_model = {
    'job_name': JOB_NAME,
    'cron_time': '00 37 13 * * *', // Send daily at 1:37pm PT
    // 'cron_time': '*/30 * * * * *', // For testing
    'on_tick': function(){
        logger.info('Starting abandoned-users script...');

        let count_total   = 0;
        let count_sent    = 0;
        let count_error   = 0;
        const sent_emails_list = [];

        const today       = new Date();
        const yesterday   = new Date(today.setDate(today.getDate()-1));

        const leads_query = {
            'creation_timestamp': {$gte: yesterday}
        };
        const cursor = Leads.find(leads_query).sort({creation_timestamp: -1}).cursor({'batchSize': 100});

        Leads.find(leads_query).sort({creation_timestamp: -1}).count().lean().exec()
        .then(leads_count => {
            let count_so_far = 0;
            count_total = leads_count;

            // Cursor
            cursor.eachAsync(doc => {
                doc = doc.toObject();
                count_so_far++;

                logger.debug(`#${count_so_far} of ${count_total}: Sending email to ${doc.email}`);

                return Private.sendMandrillAbandonedUsersEmail(doc.email, null, null)
                .then(res => {
                    count_sent++;
                    sent_emails_list.push(doc.email);

                    logger.debug(`Successfully sent email to ${doc.email}!`);
                })
                .catch(err => {
                    count_error++;
                    logger.error(`Error sending mandrill email to ${doc.email}. ${err} ${err.stack}`);
                })
            })
            .then(() => {
                logger.info(`Done with cursor - sending summary email! Total Count: ${count_total}, Total Emails Sent: ${count_sent}`);

                let mail_options = {
                    'from': `"Wheelwell Task Service" <${config.mail_user}>`,
                    'to': (config.env === 'production') ? config.prod_email_list : config.dev_email_list,
                    'subject': `${new Date().toLocaleDateString()} - Job Update <${JOB_NAME} - ${config.env}>`,
                    'html': Private.populateEmail(JOB_NAME, sent_emails_list, count_total, count_sent, count_error)
                };

                // Send summary email
                transporter.sendMail(mail_options, (error, info) => {
                    if (error) return logger.error(`Error sending summary email for job ${JOB_NAME} \n\n${error}`);

                    logger.debug(`Summary email sent successfully for job ${JOB_NAME}`);
                })
            })
            .catch(error => {
                logger.error(`Error finishing cursor. Total Count: ${count_total}, Total Emails Sent So Far: ${count_sent}`);
                logger.debug('Sent List: ', sent_emails_list);

                let mail_options = {
                    'from': `"Wheelwell Task Service" <${config.mail_user}>`,
                    'to': (config.env === 'production') ? config.prod_email_list : config.dev_email_list,
                    'subject': `${new Date().toLocaleDateString()} - Job Update <${JOB_NAME} - ${config.env}>`,
                    'html': Private.populateEmail(JOB_NAME, sent_emails_list, count_total, count_sent, count_error, error)
                };

                // Send summary email
                transporter.sendMail(mail_options, (error, info) => {
                    if (error) return logger.error(`Error sending error email for job ${JOB_NAME} \n\n${error}`);

                    logger.debug(`Error email sent successfully for job ${JOB_NAME}`);
                })
            })
        })

    },
    'on_complete': function(){
        // function to run when .stop() is called on job <optional>
    },
    'start': false,
    'timezone': 'America/Los_Angeles'
};

module.exports = cron_model;
