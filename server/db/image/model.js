'use strict'

/************************************************************************
 * External Dependencies
 ***********************************************************************/
const mongoose      = require('mongoose')

/************************************************************************
 * Schema
 ***********************************************************************/
const Schema        = mongoose.Schema

const ImageSchema 	= Schema({

    //========= Ownership =========//

    // Owner of the image
    owners              : [{
        type                : Schema.Types.ObjectId,
        ref                 : 'User',
        index               : true
    }],


    //============ Data ============//

    // URLs of the image
    large_key           : {
        type                : String,
        required            : true
    },
    medium_key          : {
        type                : String,
        required            : true
    },
    thumb_key           : {
        type                : String,
        required            : true
    },

    // Name of the image
    title               : String,

    // Description of the image
    description         : String,

    // Dimensions and type of the image
    dimensions          : {
        large           : {
            height      : Number,
            width       : Number
        },
        medium          : {
            height      : Number,
            width       : Number
        },
        thumb           : {
            height      : Number,
            width       : Number
        }
    },

    //===== Likes and Coments ======//

    // Comments on the Image
    comments            : [{
        type                : Schema.Types.ObjectId,
        ref                 : 'Comment'
    }],

    // People who like the Image
    likes               : [{
        type                : Schema.Types.ObjectId,
        ref                 : 'User'
    }],

    anon_likes          : [Number],

    anon_like_count     : Number,

    //========= Tags =========//

    // Array of tag objects for each image
    tags                : [{
        // User that added the tag
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },

        // Id of the tagged part in the photo
        object_id: {
            type: Schema.Types.ObjectId,
            ref: 'Part'
        },

        // Collection tagged object resides
        type: {
            type: String,
            enum: ['Part', 'Vehicle']
        },

        // Name of the part - to be shown in part display and used in alt/title tags (if part is a manual add, not populated from Parts collection)
        name: {
            type: String
        },

        // Url tag is linked to, if anything
        url: {
            type: String
        },

        // Description of the part to be used as an alt/title tag
        description: {
            type: String
        },

        manual_entry: {
            type: Boolean,
            default: false
        },

        // Coordinate of the tag
        position: {
            x: {
                type: Number
            },
            y: {
                type: Number
            }
        }
    }],

    users               : [{
        type                : Schema.Types.ObjectId,
        ref                 : 'User',
        sparse              : true
    }],

    brands              : [{
        type                : Schema.Types.ObjectId,
        ref                 : "Brand",
        sparse              : true
    }],

    vehicles            : [{
        type                : Schema.Types.ObjectId,
        ref                 : "Vehicle",
        sparse              : true
    }],

    parts               : [{
        type                : Schema.Types.ObjectId,
        ref                 : "Vehicle",
        sparse              : true
    }],



    //========= Roles =========//

    type                : {
        type                : String,
        required            : true,
        default             : 'PHOTO',
    },

    is_primary          : {
        type                : Boolean,
        required            : true,
        default             : false,
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

ImageSchema.index({large_key: 1})


/************************************************************************
 * Middleware
 ***********************************************************************/

ImageSchema.virtual('large').get(function(){
    return 'https://d1oglr07rm6q0i.cloudfront.net/' + (this.large_key)
    // return 'https://d1juqo69tkizbw.cloudfront.net/' + (this.large_key)
})

ImageSchema.virtual('medium').get(function(){
    return 'https://d1oglr07rm6q0i.cloudfront.net/' + (this.medium_key)
    // return 'https://d1juqo69tkizbw.cloudfront.net/' + (this.medium_key)
})

ImageSchema.virtual('thumb').get(function(){
    return 'https://d1oglr07rm6q0i.cloudfront.net/' + (this.thumb_key)
    // return 'https://d1juqo69tkizbw.cloudfront.net/' + (this.thumb_key)
})

ImageSchema.set('toJSON', {
   virtuals: true
})

ImageSchema.set('toObject', {
   virtuals: true
})


/************************************************************************
 * Export Model
 ***********************************************************************/

module.exports = mongoose.model('Image', ImageSchema)
