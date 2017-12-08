'use strict'

/************************************************************************
 * External Dependencies
 ***********************************************************************/
const mongoose      = require('mongoose')

/************************************************************************
 * Schema
 ***********************************************************************/
const Schema        = mongoose.Schema

const VehicleSchema = Schema({

    //========= Ownership =========//

    // Poster of the part
    poster              : {
        type                : Schema.Types.ObjectId,
        ref                 : 'User',
        required            : true
    },
    // Owner of the part
    owners              : [{
        type                : Schema.Types.ObjectId,
        ref                 : 'User',
        index               : true
    }],

    // string of owner's name for search
    owner_name          : {
        type                : String
    },

    // brands reference
    brand_references    : [{
        type                : Schema.Types.ObjectId,
        ref                 : 'Brand',
        index               : true
    }],

    // brands that owns vehicles
    brand               : {
        type                : Schema.Types.ObjectId,
        ref                 : 'Brand',
        index               : true
    },

    // brands that owns vehicles
    owners_club               : {
        type                : Schema.Types.ObjectId,
        ref                 : 'OwnersClub',
        index               : true
    },

    //============ Data ============//

    // Boolean flagging the vehicle as incomplete
    unknown             : {
        type                : Boolean,
        default             : false,
    },

    // Make of with this vehicle
    make                : {
        type                : String,
        required            : true,
        index               : true,
    },
    // Model of with this vehicle
    model               : {
        type                : String,
        required            : true,
        index               : true,
    },
    // Year of with this vehicle
    year                : {
        type                : Number,
        required            : false,
        index               : true,
    },
    year_string         : {
        type                : String,
        index               : true
    },
    // Trim of with this vehicle
    trim                : {
        type                : String,
        required            : false,
        index               : true,
    },

    build_type          : {
        type                : String
    },

    vehicle_category    : {
        type                : String
    },

    generation_id       : {
        type                : Schema.Types.ObjectId,
        ref                 : 'MasterVehicleRecord_v1',
        index               : true
    },

    generation_name       : {
        type                : String,
        required            : false,
        index               : true,
    },

    // User's description of the vehicle
    description         : String,

    short_description       : {
        type                    : String,
        validate                : {
            validator               : function(text) {
                return text.length <= 200
            },
            message                 : '{VALUE} is not a valid phone number!'
        },
    },

    // Friendly vehicle name for URL
    slug                : String,

    // Stock vehicle associated with this vehicles
    stock               : {
        type                : Schema.Types.ObjectId,
        ref                 : 'StockVehicle',
        required            : false,
    },

    // Vehicle's location
    location                : {
        name                    : String,
        coordinates                 : {
            type                        : {
                type                        : String,
                enum                        : ['Point'],
            },
            coordinates                 : {
                type                        : [Number],
                index                       : '2dsphere'
            }
        }
    },


    // Specifications for the vehicle
    specs               : Schema.Types.Mixed,

    // Spec sheets for the vehicle
    spec_sheets              : [{
        type                : Schema.Types.ObjectId,
        ref                 : 'Image'
    }],

    // Primary spec sheet of the vehicle
    primary_sheet       : {
        type                : Schema.Types.ObjectId,
        ref                 : 'Image'
    },

    // For sale status
    for_sale            : {
        type                : Boolean,
        default             : false
    },

    // Ownership status
    ownership_status            : {
        type                : String,
        enum                : ['PREVIOUS', 'CURRENT', 'FUTURE'],
        required            : true,
        default             : 'CURRENT',
    },


    previously_owned    : {
        type                : Boolean,
        default             : false
    },
    future_car          : {
        type                : Boolean,
        default             : false
    },
    private             : {
        type                : Boolean,
        default             : false
    },

    // // Parts on the vehicle
    // parts               : [{
    //     type                : Schema.Types.ObjectId,
    //     ref                 : 'Part'
    // }],

    // // Future Parts on the vehicle
    // parts_wish_list     : [{
    //     type                : Schema.Types.ObjectId,
    //     ref                 : 'Part'
    // }],

    // Hashtags on the vehicle
    tags                 : [{
        type                : String
    }],

    part_mod_scores     : Schema.Types.Mixed,

    mod_score           : {
        type                : Number,
        default             : 0,
        index               : true,
    },

    // Used in MPR
    part_count          : {
        type                : Number,
        default             : 0,
        index               : true,
    },


    // New counts to replace parts/parts_wish_list collections
    part_wish_list_count    : {
        type                : Number,
        default             : 0,
        index               : true,
    },

    part_installed_count    : {
        type                : Number,
        default             : 0,
        index               : true,
    },

    part_uninstalled_count  : {
        type                : Number,
        default             : 0,
        index               : true,
    },


    part_previews           : [{
        brand                   : String,
        name                    : String,
        model                   : String,
        category                : String,
    }],

    // Part categories selected to add to this vehicle
    part_categories     : [String],


    // Primary image of the vehicle
    primary_image       : {
        type                : Schema.Types.ObjectId,
        ref                 : 'Image'
    },
    // Images of the vehicle
    images              : [{
        type                : Schema.Types.ObjectId,
        ref                 : 'Image'
    }],

    // Primary banner image of the vehicle
    primary_banner_image: {
        type                : Schema.Types.ObjectId,
        ref                 : 'Image'
    },

    // Banner images of the vehicle
    banner_images       : [{
        type                : Schema.Types.ObjectId,
        ref                 : 'Image'
    }],

    // Forum signatures of the vehicle
    signatures              : {
        large    : {
            type                : Schema.Types.ObjectId,
            ref                 : 'Image'
        },

        small    : {
            type                : Schema.Types.ObjectId,
            ref                 : 'Image'
        }
    },
    // Comments on the vehicle
    comments            : [{
        type                : Schema.Types.ObjectId,
        ref                 : 'Comment'
    }],
    // People who like the vehicle
    likes               : [{
        type                : Schema.Types.ObjectId,
        ref                 : 'User'
    }],

    anon_likes          : [Number],

    anon_like_count     : {
        type                : Number,
        default             : 0,
    },

    like_count          : {
        type                : Number,
        default             : 0,
    },


    view_count          : {
        type                : Number,
        default             : 0,
    },

    // Past Owners of the vehicle
    past_owners         : [{
        type                : Schema.Types.ObjectId,
        ref                 : 'User'
    }],
    // Snapshots of the vehicles past
    vehicle_snapshots   : [{
        type                : Schema.Types.ObjectId,
        ref                 : 'VehicleSnapshot'
    }],



    //========= Random Number =========//
    random              : {
        type                : [Number],
        default             : [Math.random(), 0],
        index               : '2d'
    },

    //========= Counter for Vehicle URL =========//
    vehicle_url_id          : {
        type                : String,
        index               : true
    },


    //========= References =========//

    // user image belongs to
    user                : {
        type                : Schema.Types.ObjectId,
        ref                 : "Vehicle"
    },


    //========= Freshness score =========//
    last_modified_timestamp : {
        type                : Date
    },

    freshness_score_v1      : {
        type                : Number,
        default             : 0,
        index               : true,
    },

    /**************** ONBOARDING *******************/
    part_categories     : [String],

    creation_timestamp  : {
        type                : Date,
        required            : true,
        default             : Date.now,
    },

})



/************************************************************************
 * Indexes
 ***********************************************************************/

VehicleSchema.index({"mod_score": -1, "make": 1, "model": 1, year: 1, trim: 1})

VehicleSchema.index({"part_previews.category": 1, "part_previews.brand": 1, "freshness_score_v1": -1}, {sparse: true})

VehicleSchema.index({"freshness_score_v1": -1, "make": 1, "model": 1})

VehicleSchema.index({ 'location.coordinates' : '2dsphere' })

VehicleSchema.index(
    {
        make            : "text",
        model           : "text",
        year            : "text",
        trim            : "text",
        owner_name      : "text",
        'location.name' : "text",
    },
    {
        weights: {
            make            : 6,
            model           : 6,
            year            : 4,
            trim            : 4,
            owner_name      : 6,
            'location.name' : 6,
        },
        name: 'vehicle_text_index'
    }
)


/************************************************************************
 * Middleware
 ***********************************************************************/



/************************************************************************
 * Export Model
 ***********************************************************************/

module.exports =  mongoose.model('Vehicle', VehicleSchema)
