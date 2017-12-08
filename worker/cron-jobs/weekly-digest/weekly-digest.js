'use strict'

/************************************************************************
 * External Dependencies
 ***********************************************************************/
const _                   = require('lodash');
const mandrill            = require('mandrill-api/mandrill');
const mongoose            = require('mongoose');

/************************************************************************
 * Internal Dependencies
 ***********************************************************************/
const config              = require('../../../server/config/config-env.js');
const logger              = require('../../../server/utils/logger.js');
const WeeklyDigestUtility = require('./weekly-digest-utility.js');
const WeeklyDigest        = new WeeklyDigestUtility();

// Data Models =========================================================
const Connection          = require('../../../server/db/connection/model.js');
const Notification        = require('../../../server/db/notification/model.js');
const Part                = require('../../../server/db/part/model.js');
const Photo               = require('../../../server/db/image/model.js');
const Post                = require('../../../server/db/post/model.js');
const User                = require('../../../server/db/user/model.js');
const Vehicle             = require('../../../server/db/vehicle/model.js');

/************************************************************************
 * Model Configurations
 ***********************************************************************/
const JOB_NAME            = 'ww-weekly-digest';
const mandrill_client     = new mandrill.Mandrill(config.mandrill_api_key);
const transporter         = config.transporter;

/************************************************************************
 * Private Methods
 ***********************************************************************/
const Private = {};

Private.sendMandrillWeeklyDigestEmail = (global_merge_vars, to_email, to_name, subject, send_at) => new Promise((resolve, reject) => {
    const message = {
        "from_email": "info@wheelwell.com",
        "from_name": "Wheelwell",
        "to": [{
                "email": to_email,
                "name": to_name,
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
        "global_merge_vars": [
            {
                "name": "user_info",
                "content": global_merge_vars.user_info
            },
            {
                "name": "display_summary",
                "content": global_merge_vars.user_follow_count_last_week && global_merge_vars.like_count_last_week
            },
            {
                "name": "user_follow_count_last_week",
                "content": global_merge_vars.user_follow_count_last_week
            },
            {
                "name": "user_follow_count_total",
                "content": global_merge_vars.user_follow_count_total
            },
            {
                "name": "like_count_last_week",
                "content": global_merge_vars.like_count_last_week
            },
            {
                "name": "like_count_total",
                "content": global_merge_vars.like_count_total
            },
            {
                "name": "recent_posts",
                "content": global_merge_vars.recent_posts
            },
            {
                "name": "recent_editorial_content",
                "content": global_merge_vars.recent_editorial_content
            },
            {
                "name": "follower_part_add_count",
                "content": global_merge_vars.follower_activity['PART_ADD'] ? global_merge_vars.follower_activity['PART_ADD'].count : 0
            },
            {
                "name": "follower_part_adds",
                "content": global_merge_vars.follower_activity['PART_ADD'] ? global_merge_vars.follower_activity['PART_ADD'].activities.slice(0, 29) : []
            },
            {
                "name": "follower_photo_add_count",
                "content": global_merge_vars.follower_activity['PHOTO_POST'] ? global_merge_vars.follower_activity['PHOTO_POST'].count : 0
            },
            {
                "name": "follower_photo_adds",
                "content": global_merge_vars.follower_activity['PHOTO_POST'] ? global_merge_vars.follower_activity['PHOTO_POST'].activities.slice(0, 19) : []
            },
            {
                "name": "recent_photos",
                "content": global_merge_vars.recent_photos
            },
            {
                "name": "follower_vehicle_add_count",
                "content": global_merge_vars.follower_activity['VEHICLE_ADD'] ? global_merge_vars.follower_activity['VEHICLE_ADD'].count : 0
            },
            {
                "name": "follower_vehicle_adds",
                "content": global_merge_vars.follower_activity['VEHICLE_ADD'] ? global_merge_vars.follower_activity['VEHICLE_ADD'].activities : []
            },
            {
                "name": "my_last_post",
                "content": global_merge_vars.my_last_post
            },
            {
                "name": "my_parts_added",
                "content": global_merge_vars.my_parts_added
            },
            {
                "name": "my_photos_added",
                "content": global_merge_vars.my_photos_added
            },
            {
                "name": "my_new_followers",
                "content": global_merge_vars.my_new_followers
            },
            {
                "name": "start_date",
                "content": global_merge_vars.start_date
            },
            {
                "name": "end_date",
                "content": global_merge_vars.end_date
            }
        ],

        "google_analytics_domains": [
            "wheelwell.com",
            "www.wheelwell.com",
        ],
        "metadata": {
            "website": "wheelwell.com"
        },
    };

    if (subject) message.subject = subject;
    message.tags = ['Weekly-Digest'];
    message.google_analytics_campaign = 'Weekly-Digest';

    let template = {
        "template_slug": 'weekly-digest-email-1',
        "template_name": 'Weekly Digest Email',
        "template_content": [],
        "message": message,
        "async": false,
    };

    if (send_at) template.send_at = send_at;

    mandrill_client.messages.sendTemplate(template,
    (result) => {
        resolve(message.global_merge_vars);
    },
    (error) => {
        logger.error('A mandrill error occurred: \n' + error.name + ' - ' + error.message);
        resolve({message: "Error sending email.", key: 'EMAIL_ERROR', code: 500});
    })
})


// Get data for weekly digest
Private.weeklyDigestEmailData = (user_id) => new Promise((resolve, reject) => {

    Promise.all([
        WeeklyDigest.getOwnerVehicleIds(user_id),
        WeeklyDigest.getPostIds(user_id),
        WeeklyDigest.getVehicleIdsFollowed(user_id)
    ])
    .then(results => {
        let vehicle_ids = results[0];
        let post_ids = results[1];
        let vehicle_ids_followed = results[2];
        let notifications = results[3];

        let today = new Date();
        let offset = today.getDay() + 6;
        let last_week = new Date(today.setDate(today.getDate() - offset));
        let end_date = new Date(today.setDate(last_week.getDate()+6));

        let user_info_query = {
            _id: user_id
        };

        let parts_count_last_week_query = {
            owners: {$in: [user_id]},
            creation_timestamp: {$gte: last_week}
        };

        let parts_count_total_query = {
            owners: {$in: [user_id]}
        };

        let user_follow_count_last_week_query = {
            'connection_type': 'FOLLOW',
            'connection.1.object_id': {$in: vehicle_ids.concat(user_id)},
            'creation_timestamp': {$gte: last_week}
        };

        let user_follow_count_total_query = {
            'connection_type': 'FOLLOW',
            'connection.1.object_id': {$in: vehicle_ids.concat(user_id)},
        };

        let vehicle_like_count_last_week_query = {
            'connection_type': 'LIKE',
            'connection.1.object_id': {$in: vehicle_ids},
            'creation_timestamp': {$gte: last_week}
        };

        let vehicle_like_count_total_query = {
            'connection_type': 'LIKE',
            'connection.1.object_id': {$in: vehicle_ids}
        };

        let post_like_count_last_week_query = {
            'connection_type': 'LIKE',
            'connection.1.object_id': {$in: post_ids},
            'creation_timestamp': {$gte: last_week}
        };

        let post_like_count_total_query = {
            'connection_type': 'LIKE',
            'connection.1.object_id': {$in: post_ids}
        };

        let comment_post_count_last_week_query = {
            root_id: {$in: post_ids},
            creation_timestamp: {$gte: last_week}
        }

        let comment_post_count_total_query = {
            root_id: {$in: post_ids}
        };

        let comment_vehicle_count_last_week_query = {
            root_id: {$in: vehicle_ids},
            creation_timestamp: {$gte: last_week}
        };

        let comment_vehicle_count_total_query = {
            root_id: {$in: vehicle_ids}
        };

        let descending_timestamp_sort = {
            creation_timestamp: -1
        };

        let notifications_query = {
            owner: user_id,
            action: {$in: ['WALL_POST', 'VEHICLE_POST', 'PHOTO_POST', 'VEHICLE_ADD', 'PART_ADD']},
            'actions.0.timestamp': {$gte: last_week}
        };

        let my_last_post_query = {
            owner: user_id,
            has_deleted: false
        };

        let my_photos_last_week_query = {
            owners: {$in: [user_id]},
            creation_timestamp: {$gte: last_week}
        };

        let all_vehicle_photos_last_week_query = {
            vehicles: {$ne: []},
            creation_timestamp: {$gte: last_week}
        };

        let all_vehicle_photos_last_week_sort = {
            creation_timestamp: -1
        };

        let editorial_content_query = {
            creation_timestamp: {$gte: last_week},
            for_weekly_digest: true,
            has_deleted: false
        };

        Promise.all([
            // Follower Count
            Connection.find(user_follow_count_last_week_query).count(), // 0
            // Vehicle Like Count
            Connection.find(vehicle_like_count_last_week_query).count(), // 1
            Connection.find(vehicle_like_count_total_query).count(), // 2
            // Post Like Count
            Connection.find(post_like_count_last_week_query).count(), // 3
            Connection.find(post_like_count_total_query).count(), // 4
            // Latest 30 posts
            WeeklyDigest.getRecentPosts(descending_timestamp_sort, 40), // 5
            // Follower Notifications
            WeeklyDigest.findNotifications(notifications_query).then(WeeklyDigest.normalizeNotifications), // 6
            // My Last Post
            Post.find(my_last_post_query).sort(descending_timestamp_sort).limit(1)
            .populate({
                path: 'owner',
                model: 'User',
                select: 'profile_name'
            })
            .populate({
                path: 'photos',
                model: 'Image'
            })
            .then(WeeklyDigest.normalizePosts), // 7
            // My Parts Added This Week
            Part.find(parts_count_last_week_query).sort(descending_timestamp_sort).limit(10).then(WeeklyDigest.normalizeParts), // 8
            // My Photos Added This Week
            Photo.find(my_photos_last_week_query).then(WeeklyDigest.normalizePhotos), // 9
            // Find Followers
            Connection.find(user_follow_count_last_week_query) // 10
            .populate({
                path: 'connection.0.object_id',
                model: 'User',
                select: 'first_name last_name name facebook birthdate primary_image profile_name location  mod_score follower_count',
                populate: [{
                    path: 'primary_image',
                    model: 'Image',
                    select: 'large_key large medium_key medium thumb_key thumb'
                }]
            })
            .then(WeeklyDigest.normalizeConnectionUsers),
            // User Information
            User.findOne(user_info_query) // 11
            .populate({
                path: 'primary_image',
                model: 'Image',
                select: 'large_key large medium_key medium thumb_key thumb'
            })
            .then(user => WeeklyDigest.normalizeUser(user)),
            // All vehicle photos added on WW over last week
            WeeklyDigest.getRecentPhotos(all_vehicle_photos_last_week_query, all_vehicle_photos_last_week_sort, 20), // 12
            // Get Editorial content
            WeeklyDigest.getRecentEditorialContent(editorial_content_query) // 13
        ])
        .then(results => {
            let user_info = results[11] || 0;
            let user_follow_count_last_week = results[0] || 0;
            let user_follow_count_total = results[11] ? results[11].follower_count : 0;
            let vehicle_like_count_last_week = results[1] || 0;
            let vehicle_like_count_total = results[2] || 0;
            let post_like_count_last_week = results[3] || 0;
            let post_like_count_total = results[4] || 0;
            let last_15_posts = results[5];
            let follower_activity = results[6];
            let my_last_post = results[7];
            let my_parts_added = results[8];
            let my_photos_added = results[9];
            let my_new_followers = results[10];
            let recent_posts = (follower_activity['POST'] && follower_activity['POST'].activities) ? WeeklyDigest.consolidatePosts(follower_activity['POST'].activities.slice(0, 8), last_15_posts) : last_15_posts;
            let recent_photos = results[12];
            let editorial_content = results[13];

            return resolve({
                user_info: user_info,
                user_follow_count_last_week: user_follow_count_last_week,
                user_follow_count_total: user_follow_count_total,
                like_count_last_week: vehicle_like_count_last_week + post_like_count_last_week,
                like_count_total: vehicle_like_count_total + post_like_count_total,
                follower_activity: follower_activity,
                my_last_post: my_last_post,
                my_parts_added: my_parts_added,
                my_photos_added: my_photos_added,
                my_new_followers: my_new_followers.slice(0, 19),
                recent_posts: recent_posts,
                recent_photos: recent_photos,
                recent_editorial_content: editorial_content,
                start_date: last_week.toLocaleDateString(),
                end_date: end_date.toLocaleDateString()
            })
        })
        .catch(error => {
            logger.error(error);
            return reject(error);
        })
    })
    .catch(error => {
        logger.error(error);
        return reject(error);
    });
});

// Send Weekly Digest Email
Private.sendWeeklyDigestEmail = (user_id) => new Promise((resolve, reject) => {
    return Private.weeklyDigestEmailData(user_id)
    .then(result => {
        if (result && result.user_info && result.user_info.email){
            return Private.sendMandrillWeeklyDigestEmail(result, result.user_info.email, result.user_info.name, null, null); // no email subject - set in Mandrill template
        } else {
            return {
                key: 'NO_EMAIL',
                message: 'No email for this user',
                data: result
            }
        }
    })
    ////// Note: Below used for testing purposes only
    // .then(result => {
    //     if (result && result.user_info && result.user_info.email){
    //         // return Private.sendMandrillWeeklyDigestEmail(result, 'tabitha@wheelwell.com', result.user_info.name, `${result.user_info.first_name}, here\'s your Weekly Recap | Wheelwell`)
    //         return Private.sendMandrillWeeklyDigestEmail(result, 'tabitha@wheelwell.com', result.user_info.name, null, null)
    //
    //     } else {
    //         return {
    //             key: 'NO_EMAIL',
    //             message: 'No email for this user',
    //             data: result
    //         }
    //     }
    // })
    .then(response => {
        return resolve(response);
    })
    .catch(error => {
        logger.error(error);
        return reject(error);
    });
});

// Populate email template
Private.populateEmail = (job_name, total_so_far, current_count, sent_count, error_count, error) => {
    let html_template = `
        <h3>Wheelwell Task Update: ${job_name}</h3>
        <p>Hey there! Finished sending weekly digest emails for today at ${new Date().toLocaleTimeString()}. Here's the summary stats so far:</p>
        <ul>
            <li>Current Count: ${current_count}</li>
            <li>Sent Count: ${sent_count}</li>
            <li>Total Sent WTD So Far: ${total_so_far}</li>
            <li>Error Count: ${error_count}</li>
        </ul>
    `;

    if (error) {
        html_template += `<p>Error finishing cursor: ${error}</p>`;
    }

    return html_template;
}


/************************************************************************
 * Public Export Template
 ***********************************************************************/
// MODEL KEYS: job_name, cron_time, on_tick, on_complete, start, timezone

const cron_weekly_digest_model = {
    'job_name': JOB_NAME,
    'cron_time': '00 00 5 * * 1,2,3', // run every T and W at 5am PT, 8am ET
    // 'cron_time': '30 * * * * *',
    'on_tick': function(){
        logger.log(`Starting weekly digest...`);

        const SKIP_MAP = {
            '1': 0, // Monday
            '2': 25000, // Tuesday
            '3': 50000 // Wednesday
        };

        const LIMIT_MAP = {
            '1': 25000, // Monday
            '2': 25000, // Tuesday
            '3': 0 // Wednesday
        };

        let current_count = 0;
        let count_sent = 0;
        let count_error = 0;
        let total_count_so_far = 0;

        const today = new Date().getDay();
        const skip = SKIP_MAP.hasOwnProperty(today) ? SKIP_MAP[today] : null;
        const limit = LIMIT_MAP.hasOwnProperty(today) ? LIMIT_MAP[today] : null;

        const query = {'type': 'USER', $and: [
            {'notification_settings_v2.content.newsletters': true},  {'notification_settings.newsletter_emails': true},  {'notification_settings_v2.content.inside_the_build': true},  {'notification_settings_v2.content.wheelwell_insider': true},
        ], $or: [
            {'local.username': {$exists: true}},
            {'facebook.email': {$exists: true}}
        ]};

        // If somehow this cron job is running on a day it's not supposed to, exit and finish
        if (skip === null || limit === null) {
            logger.error(`${JOB_NAME} running on wrong day ${today}, skip: ${skip}, limit ${limit}`);
            return;
        }

        const cursor = User.find(query).skip(skip).limit(limit).lean().cursor({'batchSize': 150});

        total_count_so_far = skip;

        cursor.eachAsync(doc => {
            current_count++;

            if (current_count % 50 === 0) {
                logger.debug(`**************************`);
                logger.debug(`${current_count}. ${doc._id} ${doc.name}`);
            }

            return Private.sendWeeklyDigestEmail(doc._id)
            .then(data => {
                if (data.key && data.key === 'NO_EMAIL') {
                    if (current_count % 50 === 0) logger.debug('Email not sent. No email found for: ', doc._id);
                    error_count++;
                } else {
                    if (current_count % 50 === 0) logger.debug('Successfully sent email digest to: ', doc._id);
                    count_sent++;
                    total_count_so_far++;
                }
            })
            .catch(error => {
                count_error++;
                if (current_count % 50 === 0) logger.error(`Error Sending Email: ${error}`);
            });
        })
        .then(() => {
            logger.info('*********************************************');
            logger.info(`DONE SENDING ${count_sent} of ${current_count} Weekly Digests today with ${count_error} errors! ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`);

            const mail_options = {
                'from': `"Wheelwell Task Service" <${config.mail_user}>`,
                'to': (config.env === 'production') ? config.prod_email_list : config.dev_email_list,
                'subject': `${new Date().toLocaleDateString()} - Weekly Digest Update <${JOB_NAME} - ${config.env}>`,
                'html': Private.populateEmail(JOB_NAME, total_count_so_far, current_count, count_sent, count_error)
            };

            // Send summary email
            transporter.sendMail(mail_options, (error, info) => {
                if (error) return logger.error(`Error sending summary email for job ${JOB_NAME} \n\n${error}`);
                logger.info(`Summary email sent successfully for job ${JOB_NAME}`);
            });

            // Clear data cache for the day
            if (today === 3) WeeklyDigest.clearDataCache();

        })
        .catch(error => {
            logger.error(`Mongo Error: ${error}`);
            logger.error(`CURSOR ERROR SENDING ${count_sent} of ${current_count} Weekly Digests with ${count_error} errors.`);

            const mail_options = {
                'from': `"Wheelwell Task Service" <${config.mail_user}>`,
                'to': (config.env === 'production') ? config.prod_email_list : config.dev_email_list,
                'subject': `${new Date().toLocaleDateString()} - Weekly Digest Update <${JOB_NAME} - ${config.env}>`,
                'html': Private.populateEmail(JOB_NAME, total_count_so_far, current_count, count_sent, count_error, error)
            };

            // Send summary email
            transporter.sendMail(mail_options, (error, info) => {
                if (error) return logger.error(`Error sending error email for job ${JOB_NAME} \n\n${error}`);
                logger.info(`Error email sent successfully for job ${JOB_NAME}`);
            });

            // Clear data cache for the day
            if (today === 3) WeeklyDigest.clearDataCache();
        })
    },
    'on_complete': function(){
        // function to run when .stop() is called on job <optional>
    },
    'start': false,
    'timezone': 'America/Los_Angeles'
};

module.exports = cron_weekly_digest_model;
