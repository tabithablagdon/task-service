'use strict'

/************************************************************************
 * External Dependencies
 ***********************************************************************/

const mongoose      = require('mongoose')

/************************************************************************
 * Schema
 ***********************************************************************/

const Schema        = mongoose.Schema

const UserSchema    = Schema({

    //======== Authentication ========//

    // Local authentication method
    local                   : {
        username                : {
            type                    : String,
            index                   : true,
            unique                  : true,
            sparse                  : true
        },
        password            : String,
        verified            : {
            type                : Boolean,
            default             : false
        }
    },
    // Facebook authentication
    facebook                : {
        id                      : {
            type                    : String,
            index                   : true,
            unique                  : true,
            sparse                  : true
        },
        token                   : String,
        email                   : String,
        permissions             : String,
        pages                   :[{
            id                      : String,
            name                    : String,
            category                : String
        }]
    },

    // Access level role
    role                    : {
        bitMask                 : {
            type                : Number,
            default             : 2
        },
        title                   : {
            type                : String,
            default             : 'user'
        },
    },


    //========= Random Number =========//
    random              : {
        type                : [Number],
        default             : [Math.random(), 0],
        index               : '2d'
    },


    //============= Logins =============//

    // last logins
    last_login              : {
        type                    : Date,
        index                   : true,
    },

    // All logins
    login_array             : [Date],



    //============= Online Status =============//
    online                  : {
        last_active             : Date,
        active_page             : String,
    },


    //============= Metrics =============//
    user_metrics            : {
        last_cached             : Date,
        metrics_array           : [{
            timestamp               : Date,
            metrics                 : Schema.Types.Mixed,
        }],
    },

    //============= Data =============//

    // Type of User - BRAND || USER
    type                    : {
        type                    : String,
        required                : true,
        enum                    : ['BRAND', 'USER'],
    },

    // User's first name
    first_name              : {
        type                    : String,
        required                : true,
        index                   : true
    },

    // User's first name
    last_name               : {
        type                    : String,
        required                : true,
        index                   : true
    },

    // User/Brand's full name
    name                    : {
        type                    : String,
    },

    // Canonical URL
    profile_name            : {
        type                    : String,
        index                   : true,
        unique                  : true
    },

    profile_name_base       : {
        type                    : String,
        required                : true,
    },

    profile_name_index      : {
        type                    : Number,
        required                : true,
    },

    // Alias URL
    alias_name              : {
        type                    : String,
        index                   : true
    },

    // Alias URL
    alias_slug              : {
        type                    : String,
        index                   : true
    },

    // User's gender
    gender                  : String,

    // User's gender
    birthdate               : Date,

    // User's timezone
    timezone                : Number,

    // User's locale
    locale                  : String,

    // User's location
    location                : {
        id                      : String,
        name                    : String,
        manual_entry            : String,
        location                : {
            type                    : {
                type                    : String,
                enum                    : ['Point'],
            },
            coordinates             : {
                type                    : [Number],
                index                   : '2dsphere'
            }
        }
    },

    // User's emails
    emails                  : [String],


    // User's description
    description             : String,

    // Whether description is unique
    is_unique_description   : {
        type                    : Boolean,
        default                 : false
    },

    short_description       : {
        type                    : String,
        validate                : {
            validator               : function(text) {
                return text.length <= 200
            },
            message                 : '{VALUE} is not a valid phone number!'
        },
    },


    // Boolean controlling user email notifications
    email_notifications     : {
        type                    : Boolean,
        default                 : true
    },

    // Is user part of Team Wheelwell - true or false
    team_wheelwell     : {
        type                    : Boolean,
        default                 : false
    },

    //============= Brand Specific Data =============//

    contact             : {
        address             : {
            street_address_one     :   {
                type                : String
            },
            street_address_two     :   {
                type                : String
            },
            city                   :   {
                type                : String
            },
            state                  :   {
                type                : String
            },
            zip_code               :   {
                type                : String
            },
            country                :   {
                type                : String
            },
        },

        email               : {
            type                : String
        },

        website             : {
            type                : String
        },

        // Main photo on yelp - to use if no primary image is available for a brand
        yelp_photo          : {
            type                : String
        },

        phone               : {
            type                : String
        },

        hours_open          : {
            type                : Array
        },

    },

    admins              : [{
        type                : Schema.Types.ObjectId,
        ref                 : 'User'
    }],

    tags                : [{
        type                : String,
        index               : true
    }],

    // Brand's subcategory
    subcategory         : {
        type                : String,
    },

    // Banner of the brand
    banner_images       : [{
        type                : Schema.Types.ObjectId,
        ref                 : 'Image'
    }],

    primary_banner_image: {
        type                : Schema.Types.ObjectId,
        ref                 : 'Image'
    },

    // Social Media Links - handles
    links              : {
        facebook            : {
            type                : String
        },
        twitter             : {
            type                : String
        },
        instagram           : {
            type                : String
        },
        pinterest           : {
            type                : String
        },
        youtube             : {
            type                : String
        },
        yelp                : {
            type                : String
        },
        flickr              : {
            type                : String
        }
    },


    // Object for storing notification settings
    notification_settings   : {

        like_emails             : {
            type                    : Boolean,
            default                 : true
        },

        comment_emails          : {
            type                    : Boolean,
            default                 : true
        },

        wall_post_emails        : {
            type                    : Boolean,
            default                 : true
        },

        friend_request_emails   : {
            type                    : Boolean,
            default                 : true
        },

        club_request_emails     : {
            type                    : Boolean,
            default                 : true
        },

        club_post_emails        : {
            type                    : Boolean,
            default                 : true
        },

        newsletter_emails       : {
            type                    : Boolean,
            default                 : true
        },

    },

    notification_settings_v2:{

        action_keys             : {
            'FOLLOW'                : {
                type                    : Number,
                default                 : 0,
                enum                    : [0],
            },
            'LIKE'                  : {
                type                    : Number,
                default                 : 1,
                enum                    : [1],
            },
            'COMMENT'               : {
                type                    : Number,
                default                 : 2,
                enum                    : [2],
            },
            'WALL_POST'             : {
                type                    : Number,
                default                 : 3,
                enum                    : [3],
            },
            'VEHICLE_POST'          : {
                type                    : Number,
                default                 : 4,
                enum                    : [4],
            },
        },

        target_keys             : {
            'Album'                 : {
                type                    : Number,
                default                 : 0,
                enum                    : [0],
            },
            'Image'                 : {
                type                    : Number,
                default                 : 1,
                enum                    : [1],
            },
            'Vehicle'               : {
                type                    : Number,
                default                 : 2,
                enum                    : [2],
            },
            'Part'                  : {
                type                    : Number,
                default                 : 3,
                enum                    : [3],
            },
            'Post'                  : {
                type                    : Number,
                default                 : 4,
                enum                    : [4],
            },
            'V2_Comment'            : {
                type                    : Number,
                default                 : 5,
                enum                    : [5],
            },
            'User'                  : {
                type                    : Number,
                default                 : 6,
                enum                    : [6],
            },
        },

        email                   : [
            [
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
            ],
            [
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
            ],
            [
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
            ],
            [
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
            ],

        ],

        apn                     : [
            [
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
            ],
            [
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
            ],
            [
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
            ],
            [
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
                {type: Boolean, default: true},
            ],

        ],

        content             : {
            inside_the_build    : {type: Boolean, default: true},
            wheelwell_insider   : {type: Boolean, default: true},
            blog_posts          : {type: Boolean, default: true},
            newsletters         : {type: Boolean, default: true},
        }

    },

    // Recent activity
    activity                : [{
        type                    : Schema.Types.ObjectId,
        ref                     : 'Activity'
    }],

    // Vehicles owned by the user
    vehicles                : [{
        type                    : Schema.Types.ObjectId,
        ref                     : 'Vehicle',
        index                   : true,
    }],

    // Vehicles referenced, but not owned by the user
    vehicles_ref             : [{
        type                    : Schema.Types.ObjectId,
        ref                     : 'Vehicle',
        index                   : true,
    }],

    vehicle_previews        : [{
        make                : {
            type                : String,
            index               : true,
        },
        // Model of with this vehicle
        model               : {
            type                : String,
            index               : true,
        },
        // Year of with this vehicle
        year                : {
            type                : String,
            index               : true,
        },

        // Trim of with this vehicle
        trim                : {
            type                : String,
            index               : true,
        },
    }],

    // Primary image of the user
    primary_image           : {
        type                    : Schema.Types.ObjectId,
        ref                     : 'Image'
    },

    // Images the user has been tagged in
    images                  : [{
        type                    : Schema.Types.ObjectId,
        ref                     : 'Image'
    }],

    // People who like the user's garage
    likes                   : [{
        type                    : Schema.Types.ObjectId,
        ref                     : 'User'
    }],

    // User's privacy settings
    privacy                 : {
        type                    : String,
        default                 : "PUBLIC",
        enum                    : ['PUBLIC', 'FRIENDS', 'PRIVATE', 'HIDDEN']
    },
    // Blocked Users
    blocked                 : [{
        type                    : Schema.Types.ObjectId,
        ref                     : 'User'
    }],
    // Friends and friend requests
    friends                 : {
        friends                 : [{
            type                    : Schema.Types.ObjectId,
            ref                     : 'User',
            index                   : true,
        }],
        // Requests
        requests                : {
            sent                    : [{
                type                    : Schema.Types.ObjectId,
                ref                     : 'User'
            }],
            received            : [{
                type                : Schema.Types.ObjectId,
                ref                 : 'User'
            }]
        }
    },

    // Friends and friend requests
    follower_count          : {
        type                    : Number,
        default                 : 0,
    },

    groups                  : {
        groups                  : [{
            type                    : Schema.Types.ObjectId,
            ref                     : 'Group',
            index                   : true,
        }],
        // Requests
        requests                : {
            sent                    : [{
                type                    : Schema.Types.ObjectId,
                ref                     : 'Group'
            }],
            received                : [{
                type                    : Schema.Types.ObjectId,
                ref                     : 'Group'
            }]
        }
    },


    // Brands
    brands                  : [{
        type                    : Schema.Types.ObjectId,
        ref                     : 'Brand',
        index                   : true,
    }],

    instagram_access_token  : {
        type:               String
    },

    instagram_user_id  : {
        type:               String
    },

    // Owners Clubs
    owners_clubs                  : [{
        type                    : Schema.Types.ObjectId,
        ref                     : 'OwnersClub',
        index                   : true,
    }],



    // admininstrator of brands
    admin_brands                  : [{
        type                    : Schema.Types.ObjectId,
        ref                     : 'Brand'
    }],


    // Albums
    albums                 : [{
        type                    : Schema.Types.ObjectId,
        ref                     : 'Album'
    }],

    wall_photos            : {
        type                    : Schema.Types.ObjectId,
        ref                     : 'Album'
    },



    page_views              : {
        weeks                   : [{
            week_id               : String,
            count                 : {
                type                    : Number,
                default                 : 0
            },

        }]

    },

    comment_score           : {
        type                    : Number,
        default                 : 0,
    },

    post_score              : {
        type                    : Number,
        default                 : 0,
    },

    score_cache_timestamp   : {
        type                    : Date,
    },

    mod_score               : {
        type                    : Number,
        default                 : 0,
        index                   : true,
    },

    notifications           : Schema.Types.Mixed,

    // Interests
    vehicle_category_interests  : [{
        type                    : String
    }],

    build_type_interests        : [{
        type                    : String
    }],

    // WW User that referred this user
    referrer                  : [{
        type                    : Schema.Types.ObjectId,
        ref                     : 'User'
    }],

})



/************************************************************************
 * Indexes
 ***********************************************************************/

UserSchema.index({ 'online.last_active' : 1, 'online.active_page' : 1})

UserSchema.index({ 'location.location' : '2dsphere' })

UserSchema.index({ '_id' : 1, 'friends.friends': 1 })

UserSchema.index({ 'type': 1 })

UserSchema.index({ name: 1, type: 1 })

UserSchema.index({profile_name_base: 1, profile_name_index: -1})

UserSchema.index({"online.active_page": 1, "online.last_active": 1})

UserSchema.index({"_id": 1, "online.last_active": 1})

UserSchema.index({"links.yelp": 1}, {"unique": true, "partialFilterExpression": {"links.yelp": {$type: "string"}}})

UserSchema.index({"instagram_user_id": 1})

UserSchema.index(
    {
        alias_name                  : "text",
        name                        : "text",

        'location.name'             : "text",
        'location.manual_entry'     : "text",
        privacy                     : 1,
        type                        : 1,
    },
    {
        weights: {
            alias_name                  : 20,
            name                        : 10,

            'location.name'             : 2,
            'location.manual_entry'     : 2,
        },
        name: 'user_text_index',
    }
)

/************************************************************************
 * Middleware
 ***********************************************************************/




/************************************************************************
 * Export Model
 ***********************************************************************/

module.exports =  mongoose.model('User', UserSchema)

module.exports.on('index', function(error) {
    if (error) {
        console.error('User index error: %s', error);
    }
    console.log('User model indexed')
});
