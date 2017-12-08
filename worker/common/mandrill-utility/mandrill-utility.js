'use strict'

/************************************************************************
 * External Dependencies
 ***********************************************************************/
const chalk           = require('chalk');
const mandrill        = require('mandrill-api/mandrill');


/************************************************************************
 * Internal Dependencies
 ***********************************************************************/
const config          = require('../../../server/config/config-env.js');
const logger          = require('../../../server/utils/logger.js');

/************************************************************************
 * Configurations
 ***********************************************************************/
const mandrill_client = new mandrill.Mandrill(config.mandrill_api_key);
const BASE_URL = (config.env === 'production') ? 'https://www.wheelwell.com' : 'https://staging.wheelwell.com';

/************************************************************************
 * Module
 ***********************************************************************/
const MandrillUtility = {};

/**
 * [populateUserInfo - Populate the user_info field for mandrill global_merge_vars]
 * @param  {[object]} user [user object from database]
 * @return {[object]}      [object containing user_info needed for mandrill email]
 */
MandrillUtility.populateUserInfo = (user) => {
    const user_info = {};

    if (!user) return user_info;

    user_info.account_url = `${BASE_URL}/profile/${user._id}/account`; // user account settings page url
    user_info.alias_name = user.alias_name || '';
    user_info.email = user.local.username || (user.facebook ? user.facebook.email : '');
    user_info.first_name = user.first_name;
    user_info.last_name = user.last_name;
    user_info.mod_score = user.mod_score;
    user_info.name = user.name; // full name
    user_info.profile_name = user.profile_name;
    user_info.url = `${BASE_URL}/${user.profile_name}`;

    return user_info;
};

/**
 * [sendMandrillEmail - send a Mandrill email]
 * @param  {[object]} email_data [object containing data needed to send mandril email - to and template_slug are required]
 * @return {[object]}            [response from Mandrill API]
 */
MandrillUtility.sendMandrillEmail = (email_data) => new Promise((resolve, reject) => {
    if (!email_data.to) return reject('No email');
    if (!email_data.template_slug) return reject('Missing Template Slug');

    const message = {
        "from_email": "info@wheelwell.com",
        "from_name": "Wheelwell",
        "to": [{
                "email": email_data.to,
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
        "global_merge_vars": email_data.global_merge_vars || [],

        "google_analytics_domains": [
            "wheelwell.com",
            "www.wheelwell.com",
        ],
        "metadata": {
            "website": "wheelwell.com"
        },
    };

    if (email_data.subject) message.subject = email_data.subject;
    message.tags = email_data.tags || [];
    message.google_analytics_campaign = email_data.ga_campaign || 'transactional-email';

    let template = {
        "template_slug": email_data.template_slug,
        "template_name": email_data.template_name,
        "template_content": [],
        "message": message,
        "async": false,
    };

    if (email_data.send_at) template.send_at = email_data.send_at;

    mandrill_client.messages.sendTemplate(template,
    (result) => {
        resolve(result);
    },
    (error) => {
        logger.error('A mandrill error occurred: \n' + error.name + ' - ' + error.message);
        resolve({message: "Error sending email.", key: 'EMAIL_ERROR', code: 500});
    });
});

/************************************************************************
 * Public Export
 ***********************************************************************/
module.exports = MandrillUtility;
