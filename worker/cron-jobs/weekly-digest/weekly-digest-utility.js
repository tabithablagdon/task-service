// Weekly Digest Constructor

// Dependencies ========================================================
const _                 = require('lodash')
const moment            = require('moment')
const mongoose          = require('mongoose')

const logger            = require('../../../server/utils/logger.js');

// Data Models =========================================================
const Connection        = require('../../../server/db/connection/model.js')
const Notification      = require('../../../server/db/notification/model.js')
const Part              = require('../../../server/db/part/model.js')
const Photo             = require('../../../server/db/image/model.js')
const Post              = require('../../../server/db/post/model.js')
const User              = require('../../../server/db/user/model.js')
const StockVehicle      = require('../../../server/db/stock-vehicle/model.js')
const Vehicle           = require('../../../server/db/vehicle/model.js')

// Module =========================================================

const WeeklyDigest = function(){
    // Private Constants
    // const _BASE_URL = (process.env.NODE_ENV === 'production' ? 'https://wheelwell.com' : 'https://staging.wheelwell.com')
    const _BASE_URL = 'https://wheelwell.com'
    let _DATA_CACHE = {}

    // Methods
    this.clearDataCache = () => {
        _DATA_CACHE = {}
    }

    // Database queries
    this.getOwnerVehicleIds = (user_id) => new Promise((resolve, reject) => {
        Vehicle.find({
            owners: {$in: [user_id]}
        })
        .select('_id')
        .then(results => {
            let vehicle_ids = []

            if (results){
                vehicle_ids = results.map(vehicle => {
                    return vehicle._id
                })
            }

            resolve(vehicle_ids)
        })
        .catch(error => {
            logger.error(error)
            return reject(error)
        })
    })

    this.getVehicleImageIds = (user_id) => new Promise((resolve, reject) => {
        Photo.find({
            owners: {$in: [user_id]}
        })
        .select('_id')
        .then(results => {
            let image_ids = []

            if (results){
                image_ids = results.map(image => {
                    return image._id
                })
            }

            resolve(image_ids)
        })
        .catch(error => {
            logger.error(error)
            return reject(error)
        })
    })

    this.getPostIds = (user_id) => new Promise((resolve, reject) => {
        Post.find({
            owner: user_id
        })
        .select('_id')
        .then(results => {
            let post_ids = []

            if (results){
                post_ids = results.map(post => {
                    return post._id
                })
            }

            resolve(post_ids)
        })
        .catch(error => {
            logger.error(error)
            return reject(error)
        })
    })

    this.getVehicleIdsFollowed = (user_id) => new Promise((resolve, reject) => {
        let vehicles_followed_query = {
            'connection_type': 'FOLLOW',
            'connection.0.object_id': user_id,
            'connection.1.object_type': 'Vehicle'
        }

        Connection.find(vehicles_followed_query)
        .then(results => {
            resolve(results.map(connection => {
                return connection.connection[1].object_id
            }))
        })
        .catch(error => {
            logger.error(error)
            return reject(error)
        })
    })

    this.getRecentPhotos = (query, sort, limit) => new Promise((resolve, reject) => {
        if (_DATA_CACHE.hasOwnProperty('recent_photos')) {
            // logger.log('Recent photos in cache')
            resolve(_DATA_CACHE.recent_photos)
        } else {
            Photo.find(query).sort(sort).limit(limit)
            .populate({
                path: 'vehicles',
                model: 'Vehicle',
                select: 'make model year poster slug vehicle_url_id',
                populate: [{
                    path: 'poster',
                    model: 'User',
                    select: 'first_name last_name profile_name alias_name name'
                }]
            })
            .then(photos => {
                _DATA_CACHE.recent_photos = this.normalizePhotos(photos)
                resolve(_DATA_CACHE.recent_photos)
            })
            .catch(error => reject(error))
        }

    })

    this.getRecentPosts = (sort, limit) => new Promise((resolve, reject) => {
        if (_DATA_CACHE.hasOwnProperty('recent_posts')) {
            // logger.log('Recent posts found in data cache')
            resolve(_DATA_CACHE.recent_posts)
        } else {
            Post.find({has_deleted: false})
            .sort(sort)
            .limit(limit)
            .populate({
                path: 'owner',
                model: 'User',
                select: 'profile_name'
            })
            .then(posts => {
                let instagram_posts = posts.filter(post => post.instagram_id)
                let regular_posts = posts.filter(post => !post.instagram_id)
                let recent_posts = instagram_posts.slice(0, 5).concat(regular_posts)

                _DATA_CACHE.recent_posts = this.normalizePosts(recent_posts)
                resolve(_DATA_CACHE.recent_posts)
            })
            .catch(error => reject(error))
        }
    })

    this.getRecentEditorialContent = (query) => new Promise((resolve, reject) => {
        if (_DATA_CACHE.hasOwnProperty('editorial_content')) {
            // logger.log('Editorial content found in data cache')
            resolve(_DATA_CACHE.editorial_content)
        } else {
            Post.find(query)
            .populate({
                path: 'owner',
                model: 'User',
                select: 'profile_name'
            })
            .populate({
                path: 'photos',
                model: 'Image'
            })
            .then(posts => this.normalizePosts(posts))
            .then(normalized_posts => {
                _DATA_CACHE.editorial_content = normalized_posts
                resolve(normalized_posts)
            })
            .catch(error => reject(error))
        }
    })

    this.findNotifications = (query, limit) => {
        query['target_type'] = {$ne: 'BuildGuide'}
        limit = limit || 99

        return Notification.find(query)
        // Sort descending in order of time
        .sort({'has_read': 1, 'actions.timestamp': -1})
        // Limit 99 notifications
        .limit(limit)
        // Execute query
        .exec()
        // Deep Populate fields
        .then(notifications => {

            return notifications.map(notification => {
                if(!notification.actions) return notification
                for(var i = notification.actions.length - 1; i >= 1; i--){
                    for(var j = i - 1; j >= 0; j--){
                        if(notification.actions[i].actor.toString() === notification.actions[j].actor.toString()){
                            // notification.actions.splice(i, 1)
                            notification.actions.splice(j, 1)
                            break
                        }
                    }
                }
                return notification
            })
        })
        .then(notifications => Promise.all([
            Notification.populate(notifications, [
                //populate notification group
                // {
                //     path: 'data_v1.group',
                //     select: 'name primary_image',
                //     model: 'Group'
                // },

                //populate notification poster
                {
                    path: 'data_v1.poster',
                    select: 'first_name last_name primary_image facebook.id profile_name',
                    model: 'User'
                },

                //populate notification actors
                {
                    path: 'owner',
                    select: 'first_name last_name primary_image notification_settings_v2 local.username facebook.email profile_name facebook',
                    model: 'User'
                },
                {
                    path: 'actions.0.actor',
                    select: 'first_name last_name primary_image facebook.id profile_name location.name location.manual_entry mod_score follower_count description',
                    model: 'User'
                },
                {
                    path: 'actions.1.actor',
                    select: 'first_name last_name primary_image facebook.id profile_name',
                    model: 'User'
                },
            ])
            .then(notifications => Notification.populate(notifications, {
                path: 'owner.primary_image data_v1.poster.primary_image data_v1.group.primary_image actions.0.actor.primary_image actions.1.actor.primary_image',
                model: 'Image'
            }))
            .then(notifications => notifications.map(notification => notification.toObject())),

            Promise.all(notifications.map(notification => {

                notification = notification.toObject()

                if(!notification.target_type) return null

                if(['Activity', 'V2_Thread'].indexOf(notification.target_type) > -1) return {_id: notification.target_id}

                return mongoose
                .model(notification.target_type)
                .findById(notification.target_id)
                .select('primary_image make model year brand name thumb thumb_key stock owners owner vehicle root_type root_id title slug vehicle_url_id')
                .populate('primary_image', 'thumb thumb_key medium medium_key')
                .populate('stock', 'default_image.thumb_key default_image.thumb')
                .exec()
                .then(target => {
                    if(target) return target.toObject()
                    return null
                })
            })),

            Promise.all(notifications.map(notification => {

                notification = notification.toObject()

                const action = notification.actions[notification.actions.length - 1]

                if(!action) return null

                return mongoose
                .model(notification.action_type)
                .findById(action.action_id)
                .exec()
                .then(action => {
                    if(action) return action.toObject()
                    return null
                })
            })),



        ]))
        .then(response => {
            let notifications = response[0].map((notification, index) => {
                notification.target = response[1][index]
                notification.action_object = response[2][index]
                return notification
            })

            return this.generateNotificationDetails(notifications)
        })
    }


    this.generateNotificationDetails = notifications => notifications.map((notification, index) => {
        let actor_text = ''
        let actor_photo = ''

        if(!notification.target || !notification.action_object) return null

        if(!notification.target_type) return notification

        notification.actions = notification.actions.filter(action => action.actor)

        if(notification.actions.length === 0) return null

        notification.tags = [notification.action + '-' + notification.target_type]

        notification.send_email = false
        notification.send_apn = false

        // Populate timestamp from now
        notification.timestamp_from_now = null

        if(notification.timestamp) notification.timestamp_from_now = moment(notification.timestamp).fromNow()

        else if(notification.actions.length > 0 && notification.actions[0].timestamp) notification.timestamp_from_now = moment(notification.actions[0].timestamp).fromNow()
        // End populate timestamp from now

        if(notification.actions[0] && notification.actions[0].actor && notification.actions[0].actor.primary_image){
            actor_photo = notification.actions[0].actor.primary_image.thumb
        }
        else if(notification.actions[0] && notification.actions[0].actor && notification.actions[0].actor.facebook){
            actor_photo = 'https://graph.facebook.com/v2.9/' + notification.actions[0].actor.facebook.id + '/picture?type=normal'
        }
        else if(notification.actions[1] && notification.actions[1].actor  && notification.actions[1].actor.primary_image){
            actor_photo = notification.actions[1].actor.primary_image.thumb
        }
        else if(notification.actions[1] && notification.actions[1].actor  && notification.actions[1].actor.facebook){
            actor_photo = 'https://graph.facebook.com/v2.9/' + notification.actions[1].actor.facebook.id + '/picture?type=normal'
        }
        else {
            actor_photo = 'https://d3c8j4mxmubrpz.cloudfront.net/email-welcome/welcome-user-no-photo.jpg'
        }

        if(notification.actions[0] && notification.actions[0].actor){
            actor_text += notification.actions[0].actor.first_name + ' ' + notification.actions[0].actor.last_name
        }

        if(notification.actions.length === 2){
            actor_text += ' and'
        }
        else if(notification.actions.length > 2){
            actor_text += ','
        }

        if(notification.actions[1] && notification.actions[1].actor){
            actor_text += ' ' + notification.actions[1].actor.first_name + ' ' + notification.actions[1].actor.last_name
        }

        if(notification.actions.length > 2){
            actor_text += ', and ' + (notification.actions.length - 2) + ' other ' + (notification.actions.length === 3 ? 'person' : 'people')
        }

        let action_text = ''
        let template_slug = ''
        let template_name = ''
        let owner_photo = ''
        let actor_url = ''
        let actor_first_name = ''
        let actor_name = ''
        let actor_mod_score = ''
        let actor_description = ''
        let actor_follower_count = ''
        let actor_location = ''
        let actor_comment = ''

        let target_text = ''
        let target_url = ''
        let target_photo = ''

        let target_make = ''
        let target_model = ''

        if(notification.action_type === 'V2_Comment'){
            action_text =  ' commented on'
            notification.send_email = true
            notification.send_apn = true
            if(notification.target_type === 'V2_Comment'){
                action_text = ' replied to'
            }

            actor_url = '/' + notification.actions[0].actor.profile_name
            actor_first_name = notification.actions[0].actor.first_name
            actor_name = notification.actions[0].actor.first_name + ' ' + notification.actions[0].actor.last_name
            actor_mod_score = notification.actions[0].actor.mod_score
            actor_follower_count = notification.actions[0].actor.follower_count
            actor_description = striptags(notification.actions[0].actor.description)

            if(actor_description.split(' ').length > 75) actor_description = actor_description.split(' ').slice(0, 75).join(' ')

            if(notification.actions[0].actor.location){
                actor_location = notification.actions[0].actor.location.name || notification.actions[0].actor.location.manual_entry
            }
        }
        else if(notification.action_type === 'V2_Thread'){
            action_text =  ' posted a new topic in'
        }

        else if(notification.action_type === 'Activity'){
            action_text =  ' made a post'
        }

        else if(notification.action_type === 'Post'){
            action_text =  ' made a post'
        }

        else if(notification.action_type === 'Image'){
            action_text =  ' added a new photo'
        }

        else if(notification.action_type === 'Vehicle'){
            action_text =  ' added a new ride'
        }

        else if(notification.action_type === 'Part'){
            action_text =  ' installed the'
        }

        else if(notification.action_type === 'Connection'){
            actor_url = '/' + notification.actions[0].actor.profile_name
            actor_first_name = notification.actions[0].actor.first_name
            actor_name = notification.actions[0].actor.first_name + ' ' + notification.actions[0].actor.last_name
            actor_mod_score = notification.actions[0].actor.mod_score
            actor_follower_count = notification.actions[0].actor.follower_count
            actor_description = striptags(notification.actions[0].actor.description)

            if(actor_description.split(' ').length > 75) actor_description = actor_description.split(' ').slice(0, 75).join(' ')

            if(notification.actions[0].actor.location){
                actor_location = notification.actions[0].actor.location.name || notification.actions[0].actor.location.manual_entry
            }

            if(notification.action === 'FOLLOW'){
                action_text = ' started following'
                notification.send_email = true
                notification.send_apn = true
            }
            else if(notification.action === 'LIKE'){
                action_text = ' liked'

                if(notification.owner.primary_image){
                    owner_photo = notification.owner.primary_image.thumb
                }
                else if(notification.owner.facebook){
                    owner_photo = 'https://graph.facebook.com/v2.9/' + notification.owner.facebook.id + '/picture?type=normal'
                }
                else {
                    owner_photo = 'https://d3c8j4mxmubrpz.cloudfront.net/email-welcome/welcome-user-no-photo.jpg'
                }
            }
        }

        // Target Information
        if(notification.target_type === 'Album'){
            target_text = ' your album, ' + notification.target.name + '.'
            target_url = '/profile/' + notification.target.owner + '/garage/albums/' + notification.target._id
            target_photo = notification.target.primary_image ? notification.target.primary_image.thumb : ''
        }
        else if(notification.target_type === 'Image'){
            target_text = ' your photo.'
            target_photo = notification.target.thumb
        }
        else if(notification.target_type === 'Vehicle'){
            // Vehicle Add
            if(notification.action === 'VEHICLE_ADD'){
                target_text = ` ${notification.target.year} ${notification.target.make} ${notification.target.model}.`
                target_url = `/${notification.actions[0].actor.profile_name}/${notification.target.vehicle_url_id}/${notification.target.slug}`

                target_photo = notification.target.primary_image ? notification.target.primary_image.medium : notification.target.stock  && notification.target.stock.default_image && notification.target.stock.default_image.medium ? notification.target.stock.default_image.medium : ''

                if (!target_photo) target_photo = 'https://d1oglr07rm6q0i.cloudfront.net/c39a38b2-f459-40ef-945e-b69936484a98.thumb.jpg'

            // Vehicle photo add
            }else if(notification.action === 'PHOTO_POST'){
                target_text = ` to the ${notification.target.year} ${notification.target.make} ${notification.target.model}.`
                target_url = `/${notification.actions[0].actor.profile_name}/${notification.target.vehicle_url_id}/${notification.target.slug}?photo_id=${notification.action_object._id}`
                target_photo = notification.action_object.thumb ? notification.action_object.thumb : notification.action_object.medium

            // Vehicle part add
            }else if(notification.action === 'PART_ADD'){
                target_text = ` ${notification.action_object.brand} ${notification.action_object.name} on the ${notification.target.year} ${notification.target.make} ${notification.target.model}.`
                target_url = `/${notification.actions[0].actor.profile_name}/${notification.target.vehicle_url_id}/${notification.target.slug}/${notification.action_object.part_url_id}/${notification.action_object.slug}`

            }else{
                target_text = ' your ' + notification.target.year + ' ' + notification.target.model + '.'
                target_url = `/${notification.owner.profile_name}/${notification.target.vehicle_url_id}/${notification.target.slug}`

                target_photo = notification.target.primary_image ? notification.target.primary_image.medium : notification.target.stock  && notification.target.stock.default_image && notification.target.stock.default_image.medium ? notification.target.stock.default_image.medium : ''

                if (!target_photo) target_photo = 'https://d1oglr07rm6q0i.cloudfront.net/c39a38b2-f459-40ef-945e-b69936484a98.thumb.jpg'

                notification.send_email = true
                notification.send_apn = true
            }

            target_make = notification.target.make
            target_model = notification.target.model

        }
        else if(notification.target_type === 'Part'){
            target_text = ' your '  + notification.target.brand + ' ' + notification.target.name + '.'
            target_url = '/profile/' + notification.target.owners[0] + '/vehicles/' + notification.target.vehicle + '/parts/' + notification.target._id
            target_photo = notification.target.primary_image ? notification.target.primary_image.thumb : ''

        }
        else if(notification.target_type === 'Activity'){
            target_text = ' your post.'
            target_url = '/post/' + notification.target._id

        }
        else if(notification.target_type === 'OwnersClub'){
            target_text = ' your ' + notification.target.name + ' forum.'
            target_url = '/owners_club/' + notification.target._id
            target_photo = notification.target.primary_image ? notification.target.primary_image.thumb : ''

        }
        else if(notification.target_type === 'Post'){
            template_slug = 'someone-commented-on-your-post'
            template_name = 'Someone Commented on Your Post'

            actor_url = '/' + notification.actions[0].actor.profile_name
            actor_first_name = notification.actions[0].actor.first_name
            actor_name = notification.actions[0].actor.first_name + ' ' + notification.actions[0].actor.last_name
            actor_mod_score = notification.actions[0].actor.mod_score
            actor_follower_count = notification.actions[0].actor.follower_count
            actor_description = striptags(notification.actions[0].actor.description)

            if(actor_description.split(' ').length > 75) actor_description = actor_description.split(' ').slice(0, 75).join(' ')

            if(notification.actions[0].actor.location){
                actor_location = notification.actions[0].actor.location.name || notification.actions[0].actor.location.manual_entry
            }

            if(notification.owner.primary_image){
                target_photo = notification.owner.primary_image.thumb
            }
            else if(notification.owner.facebook){
                target_photo = 'https://graph.facebook.com/v2.9/' + notification.owner.facebook.id + '/picture?type=normal'
            }
            else {
                target_photo = 'https://d3c8j4mxmubrpz.cloudfront.net/email-welcome/welcome-user-no-photo.jpg'
            }

            target_text = ' your post: ' + notification.target.title + '.'
            target_url = '?pid=' + notification.target._id

        }
        else if(notification.target_type === 'V2_Thread'){
            target_text = ' your forum post.'
            target_url = '/forum/thread/' + notification.target._id + '/reply/' + notification.actions[0].action_id

        }
        else if(notification.target && notification.target.root_type === 'BuildGuide'){
            target_url = '/build-guides/the-ultimate-canyon-carver-1997-2004-chevrolet-corvette'
        }
        else if(notification.target_type === 'V2_Comment'){
            target_text = ' your comment.'

            if(notification.target.root_type === 'Activity'){
                target_url = '/post/' + notification.target.root_id
            }
            else if(notification.target.root_type === 'V2_Thread'){
                target_url = '/forum/thread/' + notification.target.root_id + '/reply/' + notification.actions[0].action_id
            }

            else if(notification.target.root_type === 'Post'){
                target_url = '?pid=' + notification.target.root_id
            }
            else if(notification.target.root_type === 'Vehicle'){
                target_url = '/profile/' + notification.owner._id + '/vehicles/' + notification.target.root_id
            }
        }
        else if(notification.target_type === 'User'){

            if(notification.action_type === 'Activity'){
                target_text =  '.'
                if(notification.actions[notification.actions.length-1] && notification.actions[notification.actions.length-1].action_id){
                    target_url = '/post/' + notification.actions[notification.actions.length-1].action_id
                }
            }
            else if(notification.action_type === 'Post'){
                if(notification.action === 'WALL_POST'){
                    target_text =  notification.action_object.title ? (': ' + notification.action_object.title + '.') : ''
                }
                else if(notification.action === 'VEHICLE_POST'){
                    target_text = ' on their vehicle: ' + notification.action_object.title + '.'
                }

                if(notification.actions[notification.actions.length-1] && notification.actions[notification.actions.length-1].action_id){
                    target_url = '?pid=' + notification.actions[notification.actions.length-1].action_id
                }
            }
            else {
                template_slug = 'you-have-a-new-follower'
                template_name = 'You Have a New Follower'
                target_text = ' you.'

                if(notification.actions[0] && notification.actions[0].actor && notification.actions[0].actor._id){
                    target_url = `/${notification.actions[0].actor.profile_name}`
                }
            }

        }

        const notification_text = actor_text + action_text + target_text


        //***************************** START COPY TESTING ****************************************//
        if(notification.action === 'FOLLOW' && notification.target_type === 'User'){

            let copy_object = {text: 'Your Garage is popular', tag: 'Exp-' + notification.tags[0] + '-17-4-13-popular'}

            notification.subject = copy_object.text
            notification.tags.push(copy_object.tag)

            if(notification.target.primary_image){
                target_photo = notification.target.primary_image.thumb
            }
            else if(notification.target.facebook){
                target_photo = 'https://graph.facebook.com/v2.9/' + notification.actions[0].actor.facebook.id + '/picture?type=normal'
            }
            else {
                target_photo = 'https://d3c8j4mxmubrpz.cloudfront.net/email-welcome/welcome-user-no-photo.jpg'
            }
        }

        else if(notification.action === 'FOLLOW' && notification.target_type === 'Vehicle'){
            template_slug = 'someone-followed-your-build'
            template_name = 'Someone Followed Your Build'

            if(notification.owner.primary_image){
                owner_photo = notification.owner.primary_image.thumb
            }
            else if(notification.owner.facebook){
                owner_photo = 'https://graph.facebook.com/v2.9/' + notification.owner.facebook.id + '/picture?type=normal'
            }
            else {
                owner_photo = 'https://d3c8j4mxmubrpz.cloudfront.net/email-welcome/welcome-user-no-photo.jpg'
            }

            let follow_user_copy = [
                {text: 'Lucky you! You have a new follower for' + target_text, tag: 'Exp-' + notification.tags[0] + '-17-4-13-lucky-you'},
                {text: notification_text, tag: 'Exp-' + notification.tags[0] + '-17-4-13-original'}
            ]

            let copy_object = follow_user_copy[Math.floor(Math.random() * follow_user_copy.length)]
            notification.subject = copy_object.text
            notification.tags.push(copy_object.tag)
        }

        else if(notification.action === 'LIKE' && notification.target_type === 'Vehicle'){
            template_slug = 'someone-liked-your-vehicle'
            template_name = 'Someone Liked Your Vehicle'

            let copy_object = {text: 'Your ' + target_make + ' ' + target_model + ' is popular! ' + actor_first_name + ' just liked your ride', tag: 'Exp-' + notification.tags[0] + '-17-4-13-popular'}

            notification.subject = copy_object.text
            notification.tags.push(copy_object.tag)
        }

        else if(notification.action_type === 'V2_Comment'){

            let text = notification.action_object.text.substring(0, 70)

            if(text && text.length > 50){
                var i = 50
                var stop_punctuation = [' ', ',', '.', ':', '?', '!']
                while(text[i] && stop_punctuation.indexOf(text[i]) === -1) i++
                text = text.substring(0, i) + '...'
            }

            actor_comment = text

            if(notification.owner.primary_image){
                owner_photo = notification.owner.primary_image.thumb
            }
            else if(notification.owner.facebook){
                owner_photo = 'https://graph.facebook.com/v2.9/' + notification.owner.facebook.id + '/picture?type=normal'
            }
            else {
                owner_photo = 'https://d3c8j4mxmubrpz.cloudfront.net/email-welcome/welcome-user-no-photo.jpg'
            }

            let subjects = []

            if (notification.target_type === 'V2_Comment'){
                subjects = [
                    {text: actor_text + ' just replied to your comment: "' + text + '"', tag: 'Exp-' + notification.tags[0] + '-17-5-17-comment-text-target'},
                    {text: 'Someone just replied to your comment', tag: 'Exp-' + notification.tags[0] + '-17-5-17-anon-actor'},
                ]
            }
            else if (notification.target_type === 'Vehicle'){
                subjects = [
                    {text: actor_text + ' just wrote on' + (notification.target_type === 'Post' ? target_text : target_text.slice(0, -1) + ': ' + text), tag: 'Exp-' + notification.tags[0] + '-17-4-13-comment-text-target'},
                ]
            }
            else if (notification.target_type === 'Post'){
                subjects = [
                    {text: 'Someone just made a comment on' + target_text, tag: 'Exp-' + notification.tags[0] + '-17-4-13-anon-actor'},
                    {text: notification_text, tag: 'Exp-' + notification.tags[0] + '-17-4-13-actor-name'}
                ]
            }
            else{
                subjects = [
                    {text: actor_text + ' just wrote on' + (notification.target_type === 'Post' ? target_text : target_text.slice(0, -1) + ': ' + text), tag: 'Exp-' + notification.tags[0] + '-17-4-13-comment-text-target'},
                    {text: actor_text + ' just wrote: ' + text, tag: 'Exp-' + notification.tags[0] + '-17-4-13-comment-text-no-target'},
                    {text: 'Someone just made a comment on' + target_text, tag: 'Exp-' + notification.tags[0] + '-17-4-13-anon-actor'},
                    {text: notification_text, tag: 'Exp-' + notification.tags[0] + '-17-4-13-actor-name'},
                ]
            }

            if (notification.target_type === 'Vehicle'){
                template_slug = 'someone-commented-on-your-vehicle'
                template_name = 'Someone Commented on Your Vehicle'
            }

            if (notification.target_type === 'V2_Comment'){
                template_slug = 'someone-commented-on-your-comment'
                template_name = 'Someone Commented on Your Comment'
            }

            let copy_object = subjects[Math.floor(Math.random() * subjects.length)]
            notification.subject = copy_object.text
            notification.tags.push(copy_object.tag)

        }

        else {
            notification.subject = notification_text
        }
        //****************************** END COPY TESTING ******************************************//

        notification.text = notification_text
        notification.actor_photo = actor_photo
        notification.target_photo = target_photo
        notification.target_url = target_url
        notification.target_make = target_make
        notification.target_model = target_model
        notification.actor_url = actor_url
        notification.actor_first_name = actor_first_name
        notification.actor_name = actor_name
        notification.owner_photo = owner_photo
        notification.actor_mod_score = actor_mod_score
        notification.actor_comment = actor_comment
        notification.actor_description = actor_description
        notification.actor_follower_count = actor_follower_count
        notification.actor_location = actor_location
        notification.template_slug = template_slug
        notification.template_name = template_name
        notification.actor_text = actor_text
        notification.action_text = action_text
        notification.target_text = target_text

        return notification

    }).filter(x => x)

    // Methods for normalizing data

    // Normalize Posts Data
    this.normalizePosts = (data) => new Promise((resolve, reject) => {
        resolve(data.filter(post => (post.title && post.title.trim()) || (post.preview_text && post.preview_text.trim())).map(post => {
            const post_data = {
                creation_timestamp: post.creation_timestamp.toLocaleDateString(),
                featured_image: post.photos && post.photos.length > 0 && post.photos[0].large ? post.photos[0].large : null,
                preview_text: post.preview_text ? _.unescape(post.preview_text.replace(/^(.{270}[^\s]*).*/, '$1')) : null,
                url: post.owner ? _BASE_URL + '/' + (post.owner.profile_name ? post.owner.profile_name : '') + '?pid=' + post._id : 'https://www.wheelwell.com'
            }

            if (post.title) {
                post_data.title = post.title.length < 70 ? _.unescape(post.title) : _.unescape(post.title.replace(/^(.{70}[^\s]*).*/, '$1')) + '...'
            } else {
                post_data.title = post.preview_text.length < 70 ? _.unescape(post.preview_text) : _.unescape(post.preview_text.replace(/^(.{70}[^\s]*).*/, '$1')) + '...'
            }

            return post_data
        }))
    })

    // Consolidate all recent posts, remove dups by title, and shorten to 15 posts
    // TO DO: Trending posts
    this.consolidatePosts = (...theArgs) => {
        return _.chain(theArgs).flatten().uniqBy(post => post.title).value().slice(0, 25)
    }

    // Normalize Part Data
    this.normalizeParts = (data) => new Promise((resolve, reject) => {
        resolve(data.map(part => {
            return {
                'name': `${part.brand} ${part.name}`,
                'vehicle_name': `${part.vehicle_year} ${part.vehicle_make} ${part.vehicle_model}`
            }
        }))
    })

    // Normalize Photo Data
    this.normalizePhotos = (data) => new Promise((resolve, reject) => {
        resolve(data.map(image => {
            const return_data = {
                photo: image.thumb || image.medium,
                creation_timestamp: image.creation_timestamp.toLocaleDateString()
            }

            if (image.vehicles && image.vehicles.length > 0 && image.vehicles[0].poster) return_data.photo_url = `${_BASE_URL}/${image.vehicles[0].poster.profile_name}/${image.vehicles[0].vehicle_url_id}/${image.vehicles[0].slug}?photo_id=${image._id}`

            return return_data
        }))
    })

    // Normalized User Object
    this.normalizeUser = (data) => {
        if (!data) return null

        const normalized_user = {
            'name': data.name || (`${data.first_name} ${data.last_name}`),
            'first_name': data.first_name,
            'last_name': data.last_name,
            'alias_name': data.alias_name || '',
            'alias_slug': data.alias_slug || '',
            'location': data.location ? (data.location.manual_entry || data.location.name) : '',
            'mod_score': data.mod_score,
            'follower_count': data.follower_count,
            'profile_name': data.profile_name,
            'url': `${_BASE_URL}/${data.profile_name}`,
            'account_url': `${_BASE_URL}/profile/${data._id}/account`,
            'birthdate': data.birthdate ? data.birthdate.toLocaleDateString() : null,
            'email': (data.local && data.local.username) ? data.local.username : (data.facebook && data.facebook.email) ? data.facebook.email : null
        }

        // Append avatar image
        if (data.primary_image){
            normalized_user.photo = data.primary_image.medium || data.primary_image.thumb
        } else if(data.facebook && data.facebook.id) {
            normalized_user.photo = 'https://graph.facebook.com/v2.9/' + data.facebook.id + '/picture?type=normal'
        } else {
            normalized_user.photo = 'https://d3c8j4mxmubrpz.cloudfront.net/email-welcome/welcome-user-no-photo.jpg'
        }

        return normalized_user
    }

    // Normalize Connection User Data
    this.normalizeConnectionUsers = (data) => new Promise((resolve, reject) => {
        resolve(_.chain(data)
        .filter(con => con.connection[0].object_id && con.connection[1].object_id)
        .uniqBy(con => con.connection[0].object_id.profile_name)
        .map(con => {
            if (con.connection[0].object_id) return this.normalizeUser(con.connection[0].object_id)
        }).filter(x => x).value())
    })

    // Normalize Notifications
    this.normalizeNotifications = (notifications_array) => new Promise((resolve, reject) => {
        const VALID_ACTIONS = {'PART_ADD': 'PART_ADD', 'PHOTO_POST': 'PHOTO_POST', 'VEHICLE_ADD': 'VEHICLE_ADD', 'POST': 'POST', 'WALL_POST': 'WALL_POST', 'VEHICLE_POST': 'VEHICLE_POST'}

        if (!notifications_array || notifications_array.length  === 0) resolve([])

        resolve(notifications_array.reduce((summary, notification) => {
            let action = notification.action

            if (VALID_ACTIONS.hasOwnProperty(action)) {
                // Normalize follower posts differently from other notifications
                if (action === 'WALL_POST' || action === 'VEHICLE_POST') {
                    action = 'POST'

                    if (!summary.hasOwnProperty(action)) {
                        summary[action] = {}
                        summary[action].count = 0
                        summary[action].activities = []
                    }

                    notification.action_object.owner = notification.actions[0].actor

                    this.normalizePosts([notification.action_object])
                    .then(post => {
                        summary[action].activities = summary[action].activities.concat(post)
                        summary[action].count++
                    })
                } else {
                    const notification_data = {
                        action: notification.action,
                        action_type: notification.action_type,
                        actor_photo: notification.actor_photo,
                        actor_profile: notification.actions[0].actor.profile_name,
                        actor_name: notification.actor_text,
                        target_url: _BASE_URL + notification.target_url,
                        target_photo: notification.target_photo
                    }

                    if (!summary.hasOwnProperty(action)) {
                        summary[action] = {}
                        summary[action].count = 0
                        summary[action].activities = []
                    }

                    if (action === 'PART_ADD') {
                        notification_data.part_name = `${notification.action_object.brand} ${notification.action_object.name}`
                        notification_data.vehicle_name = `${notification.target.year} ${notification.target.make} ${notification.target.model}`
                    }

                    if (action === 'VEHICLE_ADD') {
                        notification_data.vehicle_name = `${notification.action_object.year} ${notification.action_object.make} ${notification.action_object.model}`
                    }

                    if (action === 'PHOTO_POST') {
                        notification_data.vehicle_name = `${notification.target.year} ${notification.target.make} ${notification.target.model}`
                    }

                    summary[action].activities.push(notification_data)
                    summary[action].count++
                }

            }

            return summary

        }, {}))
    })

}

module.exports = WeeklyDigest
