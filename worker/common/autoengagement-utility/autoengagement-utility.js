'use strict'

/************************************************************************
 * External Dependencies
 ***********************************************************************/
const axios      = require('axios');
const chalk      = require('chalk');
const fs         = require('fs');

/************************************************************************
 * Internal Dependencies
 ***********************************************************************/
const config     = require('../../../server/config/config-env.js');
const logger     = require('../../../server/utils/logger.js');

const User       = require('../../../server/db/user/model.js');
const Vehicle    = require('../../../server/db/vehicle/model.js');
const Post       = require('../../../server/db/post/model.js');
const DEAD_USERS = require('./data/dead_users_11_2017.js'); // saving in memory since list is so large
const DEAD_USERS_BY_VEHICLE = require('./data/vehicles_represented_11_2017.JSON');
/************************************************************************
 * Configurations
 ***********************************************************************/
const BASE_URL = (config.env === 'production') ? 'https://www.wheelwell.com' : 'https://staging.wheelwell.com';

/************************************************************************
 * Module
 ***********************************************************************/
const AutoEngagementUtility = {};

// Cache
AutoEngagementUtility.DATA_CACHE = {
    DEAD_USERS: {
        data: (config.env === 'production') ? DEAD_USERS : [],
        count: (config.env === 'production' && DEAD_USERS) ? DEAD_USERS.length : 0,
        lastUpdated: new Date()
    },
    DEAD_USERS_BY_VEHICLE: {
        data: (config.env === 'production') ? DEAD_USERS_BY_VEHICLE : {},
        lastUpdated: new Date()
    },
    BRANDS: {
        data: [],
        count: 0,
        lastUpdated: new Date()
    }
}

const vehiclesRepresented = {};

/**
 * [getBrands - Pull list of brands with vehicles]
 * @param  {[type]} limit [description]
 * @return {[type]}       [description]
 */
AutoEngagementUtility.getBrands = () => new Promise((resolve, reject) => {
    const today = new Date();
    const timeAgo = new Date(today.setDate(today.getDate() - 365)); // 1 years ago
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const daysAgoCacheUpdated = Math.abs(today - AutoEngagementUtility.DATA_CACHE.BRANDS.lastUpdated)/MS_PER_DAY;

    if (AutoEngagementUtility.DATA_CACHE.BRANDS.data.count === 0 || daysAgoCacheUpdated > 14) {
        User.find({
            type: 'BRAND',
            vehicles: {$ne: []}
        })
        .select('name profile_name vehicles contact type')
        .lean().exec()
        .then(brands => {
            AutoEngagementUtility.DATA_CACHE.BRANDS.data = brands;
            AutoEngagementUtility.DATA_CACHE.BRANDS.count = brands.length;
            AutoEngagementUtility.DATA_CACHE.BRANDS.lastUpdated = new Date();
            resolve(brands);
        })
        .catch(error => reject);
    } else {
        logger.info(`Brands found in cache`);
        resolve(AutoEngagementUtility.DATA_CACHE.BRANDS.data);
    }
});

/**
 * [getDeadUsersByVehicle - returns dead users by vehicle map]
 * @return {[object]} [description]
 */
AutoEngagementUtility.getDeadUsersByVehicle = () => {
    return AutoEngagementUtility.DATA_CACHE.DEAD_USERS_BY_VEHICLE.data;
};

/**
 * [updateCache - Update cache data]
 * @param  {[string]} type [key of data set to update]
 * @return {[type]}      [description]
 */
AutoEngagementUtility.getDeadUsers = () => new Promise((resolve, reject) => {
    const today = new Date();
    const timeAgo = new Date(today.setDate(today.getDate() - 365)); // 1 years ago
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const daysAgoCacheUpdated = Math.abs(today - AutoEngagementUtility.DATA_CACHE.DEAD_USERS.lastUpdated)/MS_PER_DAY;

    // Update the dead user accounts data in cache data if last update was over 6 days ago
    // if (daysAgoCacheUpdated > 6 || AutoEngagementUtility.DATA_CACHE.DEAD_USERS.count === 0) {
    if (AutoEngagementUtility.DATA_CACHE.DEAD_USERS.count === 0) {
        // Dead accounts are users who haven't logged in over 1 year ago
        const user_query = {
            'type': 'USER',
            'last_login': {$lt: timeAgo},
            'vehicles': {$ne: []}
        };

        // Find list of dead user accounts with either a vehicle image or profile image
        return User.find(user_query).select('_id profile_name vehicles images facebook')
        .populate({
            path: 'vehicles',
            model: 'Vehicle',
            select: 'images make model year trim poster'
        })
        .lean()
        .exec().then(users => {
            logger.info(`Queried and found dead user accounts`);

            AutoEngagementUtility.DATA_CACHE.DEAD_USERS.data = users.filter(user => {
                // filter out users with no vehicle images
                let hasImage = false;

                AutoEngagementUtility.DATA_CACHE.DEAD_USERS.count++; // Increment count

                user.vehicles.forEach(vehicle => {
                    if (vehicle.images && vehicle.images.length > 0) hasImage = true;
                    // Create vehicles represented by user map
                    // if (!vehiclesRepresented.hasOwnProperty(vehicle.make)) vehiclesRepresented[vehicle.make] = {};
                    // if (!vehiclesRepresented[vehicle.make].hasOwnProperty(vehicle.model)) vehiclesRepresented[vehicle.make][vehicle.model] = [];
                    // vehiclesRepresented[vehicle.make][vehicle.model].push(user._id);
                });

                return hasImage;
            });

            AutoEngagementUtility.DATA_CACHE.DEAD_USERS.count = AutoEngagementUtility.DATA_CACHE.DEAD_USERS.data.length;
            AutoEngagementUtility.DATA_CACHE.DEAD_USERS.lastUpdate = new Date();

            // Create vehicles represented by user map
            // AutoEngagementUtility.DATA_CACHE.DEAD_USERS_BY_VEHICLE.data = vehiclesRepresented;

            // fs.writeFile(__dirname + '/vehicles_represented_11_2017.JSON', JSON.stringify(vehiclesRepresented), err => {
            //     if (err) throw err;
            //     logger.debug(`*** Vehicles represented at ${vehiclesRepresented} ***`);
            // });

            // Write dead users to a file
            // fs.writeFile(__dirname + '/dead_users_11_2017.JSON', JSON.stringify(AutoEngagementUtility.DATA_CACHE.DEAD_USERS.data), err => {
            //     if (err) throw err
            //     logger.debug(`*** Dead users saved to file ***`)
            // });

            resolve(AutoEngagementUtility.DATA_CACHE.DEAD_USERS.data);
        })
        .catch(reject)
    } else {
        logger.debug(`Dead users found in cache`);
        resolve(AutoEngagementUtility.DATA_CACHE.DEAD_USERS.data);
    }
});

/**
 * [getFreshestPosts - retrieves list of most recently added posts by creation timestamp]
 * @param  {[number]} limit [number of recently updated posts]
 * @return {[array]}       [list of freshest posts]
 */
AutoEngagementUtility.getFreshestPosts = (limit) => new Promise((resolve, reject) => {
    limit = limit || 25;

    Post.find()
    .limit(limit)
    .sort({_id: -1})
    .select('owner url_id author_name creation_timestamp preview_text')
    .populate({
        'path': 'owner',
        'model': 'User',
        'select': 'type profile_name alias_name'
    })
    .lean()
    .exec().then(posts => {
        resolve(posts);
    })
    .catch(reject);

});

/**
 * [getFreshestVehicles - retrives list of most recently updated vehicles]
 * @param  {[number]} limit [number of vehicles to return]
 * @return {[array]}       [list of vehicles]
 */
AutoEngagementUtility.getFreshestVehicles = (limit) => new Promise((resolve, reject) => {
    limit = limit || 10;

    Vehicle.find()
    .limit(limit)
    .sort({last_modified_timestamp: -1, freshness_score_v1: -1})
    .select('make model year owner_name freshness_score_v1 last_modified_timestamp')
    .lean()
    .exec().then(vehicles => {
        resolve(vehicles);
    })
    .catch(reject);
});

/**
 * [getRandomNumber description]
 * @param  {[type]} max [description]
 * @param  {[type]} min [description]
 * @return {[type]}     [description]
 */
AutoEngagementUtility.getRandomNumber = (max, min) => {
    if (!max || min < 0) return 0;
    min = min || 0;

    return Math.floor(Math.random() * max) + min;
}

/**
 * [getRandomVehicles - retrieve random vehicles]
 * @return {[array]} [list of random vehicles]
 */
AutoEngagementUtility.getRandomVehicles = (requestor_id, size, make, model) => new Promise((resolve, reject) => {
    if (!size || typeof size !== 'number') {
        throw new Error('Invalid parameter: Size must be a number');
    }

    size = Number(size) || 100;

    let matchQuery = {$match: {}};
    if (make) matchQuery['$match']['make'] = make;
    if (model) matchQuery['$match']['model'] = model;
    if (requestor_id) matchQuery['$match']['poster'] = {$ne: requestor_id};

    Vehicle.aggregate([
        matchQuery,
        {$sample: {size: size}}
    ])
    .then(vehicles => {
        resolve(vehicles.map(vehicle => {
            return {
                _id: vehicle._id,
                owner_name: vehicle.owner_name,
                owner_id: vehicle.owners[0],
                make: vehicle.make,
                model: vehicle.model,
                year: vehicle.year,
                freshness_score_v1: vehicle.freshness_score_v1,
                last_updated: vehicle.last_modified_timestamp,
                poster: vehicle.poster
            };
        }));
    })
    .catch(reject);

});

/**
 * [createConnection - creates follow or like connection]
 * @param  {[string]} type          [follow or like]
 * @param  {[string]} receiver_type [schema the receiver is, ie vehicle or post]
 * @param  {[string]} receiver_id   [id of receiver]
 * @param  {[string]} requestor_id  [id of requestor]
 * @return {[type]}               [description]
 */
AutoEngagementUtility.createConnection = (type, receiver_type, receiver_id, requestor_id) => {
    if (receiver_id === requestor_id) throw new Error('Invalid Paramaters: Same receiver and requestor');

    const VALID_TYPES = {'follow': 'FOLLOW', 'like': 'LIKE', 'like_silent': 'LIKE'};
    let options = {};

    // Check for valid type
    if (!type || !VALID_TYPES.hasOwnProperty(type.toLowerCase())) {
        throw new Error('Invalid type: Must provide valid connection type');
        return;
    }

    // Check for ids
    if (!receiver_id || !requestor_id) {
        throw new Error('Missing ids: Must provide receiver and requestor id');
        return;
    }

    type = type.toLowerCase();

    if (type === 'follow') {
        options = {
            'method': 'POST',
            'url': (config.env === 'production' ? 'https://api.wheelwell.com' : 'https://api-dev.wheelwell.com') + '/v1/connections',
            // 'url': 'https://api.wheelwell.com/v1/connections',
            'data': {
                'action': 'CREATE',
                'connection_type': 'FOLLOW',
                'receiver_id': receiver_id,
                'receiver_type': receiver_type,
                'requestor_id': requestor_id
            }
        };
    } else if (type === 'like' || type === 'like_silent') {
        options = {
            'method': 'POST',
            'url': (config.env === 'production' ? 'https://api.wheelwell.com' : 'https://api-dev.wheelwell.com') + '/v1/likes',
            // 'url': 'https://api.wheelwell.com/v1/likes',
            'data': {
                'toggle': false,
                'object_id': receiver_id,
                'object_type': receiver_type,
                'user_id': requestor_id
            }
        };

        // Create a like connection with no email notification
        if (type === 'like_silent') options.data.no_email = true;
    }

    return axios(options)
    .then(response => {
        if (response.data) {
            logger.info(`${type} connection made between ${receiver_type} receiver ${receiver_id} and requestor ${requestor_id}`);
        } else if (response.data && response.data.key === 'DUPLICATE'){
            // logger.info(`No connection made. Connection already exists between receiver ${receiver_id} and requestor ${requestor_id}`);
        }

        // If vehicle, increment vehicle view count
        if (receiver_type === 'Vehicle') {
            let randomViewCount = Math.floor(Math.random() * 3) + 1;

            Vehicle.update({_id: receiver_id}, {$inc: {view_count: randomViewCount}});
        }
    })
    .catch(error => logger.error(`Error Creating ${type} Connection between ${receiver_type} receiver ${receiver_id} and requestor ${requestor_id}: ${error}`));

};

/************************************************************************
 * Public Export
 ***********************************************************************/
module.exports = AutoEngagementUtility;
