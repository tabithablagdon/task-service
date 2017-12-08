'use strict'

/************************************************************************
 * External Dependencies
 ***********************************************************************/
const mongoose              = require('mongoose')

mongoose.Promise            = global.Promise

/************************************************************************
 * Schema
 ***********************************************************************/
const Schema                = mongoose.Schema

const NotificationSchema    = Schema({

    //========= References =========//

    // User that the notification should show to
    owner               : {
        type                : Schema.Types.ObjectId,
        ref                 : 'User',
        required            : true,
    },

    // Id of target object (vehicle, post, etc)
    target_id           : {
        type                : Schema.Types.ObjectId,
        required            : true,
    },

    // Schema of target object - Image, User, Post, Part, Vehicle
    target_type         : {
        type                : String,
        enum                : Object.keys(mongoose.models),
        required            : true,
    },

    //COMMENT, FORUM_POST, FOLLOW, LIKE, WALL_POST, Wall_Post, VEHICLE_POST, PHOTO_POST, VEHICLE_ADD, PART_ADD
    action              : {
        type                : String,
        required            : true,
    },

    //V2_Comment, V2_Thread, Connection, Activity, Post, Image, Vehicle, Part
    action_type         : {
        type                : String,
        required            : true,
    },

    // Actor making the request
    actions             : [
        new Schema({
            timestamp           : {
                type                : Date,
                default             : Date.now,
                required            : true,
            },
            // Type of action - Post, Image, Vehicle, etc
            action_id           : {
                type                : Schema.Types.ObjectId,
                required            : true,
            },
            // Object creating the action
            actor               : {
                type                : Schema.Types.ObjectId,
                ref                 : 'User',
                // refPath             : 'actor_type',
                required            : true,
            },

        },
        {
            _id                 : false
        })
    ],




    //========= Post state - read/unread hidden/not hidden =========//

    has_read            : {
        type                : Boolean,
        default             : false,
        required            : true,
    },

    is_hidden              : {
        type                : Boolean,
        default             : false,
        required            : true,
    },

   //============ Polyfill for old notification data ============//
    data_v1             : {
        poster              : {
            type                : Schema.Types.ObjectId,
            ref                 : 'User'
        },

        poster_name         : String,

        event               : {
            type                : String,
            required            : true,
            enum                : ['ACCEPT_FRIEND', 'REQUEST_FRIEND', 'ACCEPT_MEMBERSHIP', 'REQUEST_MEMBERSHIP', 'COMMENT_IMAGE', 'COMMENT_PART', 'COMMENT_VEHICLE', 'ALSO_COMMENT_IMAGE', 'ALSO_COMMENT_PART', 'ALSO_COMMENT_VEHICLE', 'LIKE_IMAGE', 'LIKE_PART', 'LIKE_VEHICLE', 'WALL_POST', 'COMMENT_ACTIVITY', 'ALSO_COMMENT_ACTIVITY', 'LIKE_ACTIVITY', 'COMMENT_ALBUM', 'ALSO_COMMENT_ALBUM', 'LIKE_ALBUM', 'TAG_POST', 'TAG_POST_COMMENT', 'GROUP_POST', 'THREAD_REPLY', 'FORUM_POST', 'FRIEND_POST', 'FRIEND_ALBUM', 'BRAND_POST']
        },

        // References
        user                : {
            type                : Schema.Types.ObjectId,
            ref                 : "User"
        },

        user_name           : String,

        owner               : {
            type                : Schema.Types.ObjectId,
            ref                 : "User"
        },

        owner_name          : String,


        group               : {
            type                : Schema.Types.ObjectId,
            ref                 : "Group"
        },

        group_name          : String,


        brand               : {
            type                : Schema.Types.ObjectId,
            ref                 : "Brand"
        },

        brand_name          : String,

        brand_photo         : String,

        vehicle             : {
            type                : Schema.Types.ObjectId,
            ref                 : "Vehicle"
        },

        vehicle_name        : String,

        part                : {
            type                : Schema.Types.ObjectId,
            ref                 : "Part"
        },

        part_name           : String,

        album               : {
            type                : Schema.Types.ObjectId,
            ref                 : "Album"
        },

        album_name          : String,

        user_image          : {
            type                : Schema.Types.ObjectId,
            ref                 : "Image"
        },
        spec_image          : {
            type                : Schema.Types.ObjectId,
            ref                 : "Image"
        },
        vehicle_image       : {
            type                : Schema.Types.ObjectId,
            ref                 : "Image"
        },
        part_image          : {
            type                : Schema.Types.ObjectId,
            ref                 : "Image"
        },
        part_receipt        : {
            type                : Schema.Types.ObjectId,
            ref                 : "Image"
        },
        install_image       : {
            type                : Schema.Types.ObjectId,
            ref                 : "Image"
        },
        install_receipt     : {
            type                : Schema.Types.ObjectId,
            ref                 : "image"
        },
        activity            : {
            type                : Schema.Types.ObjectId,
            ref                 : "Activity"
        },
        comment             : {
            type                : Schema.Types.ObjectId,
            ref                 : "Comment"
        },
        thread              : {
            type                : Schema.Types.ObjectId,
            ref                 : "V2_Thread"
        },
        thread_comment      : {
            type                : Schema.Types.ObjectId,
            ref                 : "V2_Comment"
        },
        thread_type         : String,
        forum               : {
            type                : Schema.Types.ObjectId,
            ref                 : "V2_Thread"
        },
        forum_name          : String,
    }


})

/************************************************************************
 * Indexes
 ***********************************************************************/

NotificationSchema.index({'owner': 1, 'target': 1, 'action': 1, 'actions.timestamp': 1, 'actions.actor': 1})

NotificationSchema.index({'owner': 1, 'actions.timestamp': -1})

NotificationSchema.index({'owner': 1, 'has_read': 1, 'actions.timestamp': -1})

NotificationSchema.index({'owner': 1, 'has_read': 1, 'is_hidden': 1, 'actions.timestamp': -1})

NotificationSchema.index({'_id':1, owner: 1})

NotificationSchema.index({'actions.action_id': 1})

NotificationSchema.index({'actions': 1})


/************************************************************************
 * Middleware
 ***********************************************************************/



/************************************************************************
 * Export Model
 ***********************************************************************/

module.exports = mongoose.model('Notification', NotificationSchema)
