'use strict'

/************************************************************************
 * External Dependencies
 ***********************************************************************/
const mongoose      = require('mongoose')

/************************************************************************
 * Schema
 ***********************************************************************/
const Schema        = mongoose.Schema

const PartSchema    = Schema({

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
        index               : true,
    }],

    brand_reference     : {
        type                : Schema.Types.ObjectId,
        ref                 : 'Brand'
    },


    //======== Mod Score ===========//
    mod_score           : {
        type                : Number,
        default             : 0,
    },


    //============ Data ============//
    // Link to part in master product record
    master_product_record: {
        type                : Schema.Types.ObjectId,
        ref                 : 'MasterProductRecord_v1'
    },

    // For sale status
    for_sale            : {
        type                : Boolean,
        default             : false
    },

    // For sale status
    installed           : {
        type                : Boolean,
        default             : true
    },
    wish_list           : {
        type                : Boolean,
        default             : false
    },

    // Primary image of the part
    primary_image       : {
        type                : Schema.Types.ObjectId,
        ref                 : 'Image'
    },
    // Images of the part
    images              : [{
        type                : Schema.Types.ObjectId,
        ref                 : 'Image'
    }],
    // Comments on the Part
    comments            : [{
        type                : Schema.Types.ObjectId,
        ref                 : 'Comment'
    }],
    // People who like the Part
    likes               : [{
        type                : Schema.Types.ObjectId,
        ref                 : 'User'
    }],

    anon_likes          : [Number],

    anon_like_count     : Number,

    // Part rating
    rating              : Number,

    // The category of the Part
    category            : {
        type                : String,
        enum                : ['airintake', 'audio', 'brakes', 'cooling', 'drivetrain', 'electrical', 'engine', 'exhaust', 'exterior', 'fluids', 'fuel', 'hvac', 'ignition', 'interior', 'lights', 'safety', 'suspension', 'tireswheels', 'tools'],
        required            : true
    },
    // The primary use of the part
    use                 : String,
    // The name of the part
    name                : {
        type                : String,
        required            : true,
        index               : true,
    },
    // The name of the part
    brand               : {
        type                : String,
        required            : true,
        index               : true,
    },
    // The name of the part
    model               : {
        type                : String,
        required            : true,
        index               : true,
    },
    _lower_model        : {
        type                : String,
        index               : true,
    },

    // Hashtags on the part
    tags                 : [{
        type                : String
    }],

    // The make of the vehicle
    vehicle_make        : {
        type                : String,
        index               : true,
    },
    // The model of the vehicle
    vehicle_model       : {
        type                : String,
        index               : true,
    },
    // The year of the vehicle
    vehicle_year        :{
        type                : String,
        index               : true,
    },
    // The Trim of the vehicle
    vehicle_trim        :{
        type                : String,
        index               : true,
    },


    // Date the part was purchased
    date                : String,
    // hyperlink of the part
    link                : String,
    // Vendor purchased from
    vendor              : String,
    // Ammount paid for the part
    price               : String,
        // Primary image of the receipt of the part
    primary_receipt     : {
        type                : Schema.Types.ObjectId,
        ref                 : 'Image'
    },
    // The purchase reciepts of the part
    receipts            : [{
        type                : Schema.Types.ObjectId,
        ref                 : 'Image'
    }],

    /***** Installation *****/
    install             : {
        // Primary Image of the installation
        primary_image               : {
            type                : Schema.Types.ObjectId,
            ref                 : 'Image'
        },
        // Images of the installation
        images              : [{
            type                : Schema.Types.ObjectId,
            ref                 : 'Image'
        }],
        // Name of the installer
        name                    : String,
        // Location of the installation
        location                : String,
        // Mileage at time of installation
        mileage                 : String,
        // Date the part was purchased
        date                    : String,
        // Ammount paid for the installation
        price                   : String,
        // Primary receipt of the installation
        primary_receipt               : {
            type                : Schema.Types.ObjectId,
            ref                 : 'Image'
        },
        // The reciepts for the installation
        receipts            : [{
            type                : Schema.Types.ObjectId,
            ref                 : 'Image'
        }],
        // Notes on the installation
        notes                   : String,
        // Additional tags
        tags                    : String,
        // Part review
        review                  : String,
        // Part review details
        review_details          : [Schema.Types.Mixed],
        // Installation Guide
        guide                   : String,
    },


    // Parts's location
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





    //========= References =========//

    // Stock item associated with this part
    stock_part          : {
        type                : Schema.Types.ObjectId,
        ref                 : "StockPart"
    },

    //========= Counter for Part URL =========//
    part_url_id          : {
        type                : String,
        index               : true
    },

    // Friendly URL
    slug                : {
       type                 : String
    },

    // Vehicle part belongs to
    vehicle             : {
        type                : Schema.Types.ObjectId,
        ref                 : "Vehicle",
        sparse              : true,
    },
    // Snapshot part belongs to
    vehicle_snapshot    : {
        type                : Schema.Types.ObjectId,
        ref                 : "VehicleSnapshot"
    },

    // The category of the Part
    part_status            : {
        type                : String,
        enum                : ['installed', 'wishlist', 'uninstalled'],
        required            : true
    },

    creation_timestamp  : {
        type                : Date,
        required            : true,
        default             : Date.now,
    },

})



/************************************************************************
 * Indexes
 ***********************************************************************/
PartSchema.index({'vehicle_make': 1, 'category': 1})

PartSchema.index({'vehicle_model': 1, 'vehicle_make': 1, 'category': 1, 'vehicle_year': 1, 'vehicle_trim': 1})

PartSchema.index({"category": 1, "vehicle_make": 1, "vehicle_model": 1, "vehicle_year": 1})

PartSchema.index({brand: 1, model: 1})

PartSchema.index({master_product_record: 1}, {sparse: true})

PartSchema.index(
    {
        name            : "text",
        brand           : "text",
        model           : "text",
        use             : "text",
        category        : "text",
        vendor          : "text",

        vehicle_make    : "text",
        vehicle_model   : "text",
        vehicle_year    : "text",
        vehicle_trim    : "text",

        'location.name' : "text",
    },
    {
        weights: {

            name            : 5,
            brand           : 1,
            model           : 1,
            use             : 1,
            category        : 1,
            vendor          : 1,

            vehicle_make    : 2,
            vehicle_model   : 5,
            vehicle_year    : 1,
            vehicle_trim    : 1,

            'location.name' : 6,
        },
        name: 'part_text_index'
    }
)


/************************************************************************
 * Middleware
 ***********************************************************************/


/************************************************************************
 * Export Model
 ***********************************************************************/

module.exports = mongoose.model('Part', PartSchema)

module.exports.on('index', function(error) {
    if (error) {
        return console.error('Part index error: %s', error)
    }
    console.log('Part finished indexing')
})
