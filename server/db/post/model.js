'use strict'

/************************************************************************
 * External Dependencies
 ***********************************************************************/

const mongoose      = require('mongoose')
// const slug          = require('slug')

// const Counter       = require('./../counters/controller.js')

/************************************************************************
 * Schema
 ***********************************************************************/

const Schema        = mongoose.Schema

const PostSchema = Schema({

    //========= URL Data =========//
    url_id              : {
        type                : String,
        unique              : true,
        index               : true,
    },
    slug                : {
        type                : String,
    },

    //========= Author =========//
    author_name         : {
        type                : String,
        required            : true,
    },

    author_image_url    : {
        type                : String,
    },

    owner           : {
        type                : Schema.Types.ObjectId,
        ref                 : 'User',
        required            : true,
    },

    //========= Content =========//
    title               : {
        type                : String,
        // required            : true,
        // validate            : {
        //     validator           : function(value) { return value.length > 0 && value.length < 300},
        //     message             : 'String length out of bounds.'
        // },
    },

    content             : {},

    word_count          : Number,

    // Array of images uploaded to the post
    photos              :[{
        type                : Schema.Types.ObjectId,
        ref                 : 'Image'
    }],

    // Data populated from embedly API containing video details
    featured_video_data : {
        author_name         : String,
        author_url          : String,
        description         : String,
        title               : String,
        url                 : String, // Url of video
        height              : String,
        width               : String,
        provider_name       : String, // Where video is hosted (such as YouTube)
        provider_url        : String,
        thumbnail_url       : String, // Thumbnail image of video for OG meta tags
        thumbnail_width     : String, // Thumbnail image width
        thumbnail_height    : String  // Thumbnail image height
    },

    preview_text        : {
        type                : String
    },

    original_post       : {
        type                : Schema.Types.ObjectId,
        ref                 : 'Post'
    },

    links               : [{
        type                : String
    }],

    tags                : [{
        type                : String
    }],

    hidden_tags         : [{
        type                : String
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

    comment_count       : {
        type                : Number,
        default             : 0,
    },

    post_count          : {
        type                : Number,
        required            : true,
        default             : 0,
    },

    creation_timestamp  : {
        type                : Date,
        required            : true,
        default             : Date.now,
    },

    has_edited          : {
        type                : Boolean,
        default             : false,
        required            : true,
    },

    last_edit_timestamp : {
        type                : Date,
        required            : true,
        default             : Date.now,
    },

    has_deleted         : {
        type                : Boolean,
        default             : false,
        required            : true,
    },

    deleted_timestamp   : {
        type                : Date,
    },

    //===== Relational Data =====//
    root_id             : {
        type                : Schema.Types.ObjectId,
        required            : true,
    },

    root_type           : {
        type                : String,
        required            : true,
    },

    canonical_type      : {
        type                : String,
        required            : true,
    },

    canonical_id        : {
        type                : Schema.Types.ObjectId,
        required            : true,
    },

    vehicle_make        : String,
    vehicle_model       : String,
    vehicle_year        : String,





    // Instagram
    instagram_id        : {
        type                   : String
    },

    instagram_created_by_full_sync : {
        type                 : Boolean,
        required             : true,
        default              : false
    },




    // Youtube
    youtube_id          : {
        type                    : String,
        unique                  : true,
        sparse                  : true,
    },

    youtube_created_by_full_sync : {
        type                 : Boolean,
        required             : true,
        default              : false
    },




    //===== Sorting =====/
    upvote_score        : {
        type                : Number,
        default             : function(){
            return Math.round((Date.now() / 1000) - 1420070400)
        },
    },

    upvote_count        : {
        type                : Number,
        default             : 0,
    },

    // Flag only admin can alter whether post is for the upcoming weekly digest
    for_weekly_digest   : {
        type                 : Boolean,
        default              : false
    },
})

/************************************************************************
 * Indexes
 ***********************************************************************/

PostSchema.index({root_id: 1})

PostSchema.index({root_id: 1, has_deleted: 1})

PostSchema.index({root_id: 1, has_deleted: 1, creation_timestamp: 1})

PostSchema.index({owner: 1, has_deleted: 1, creation_timestamp: -1})

PostSchema.index({has_deleted: 1, creation_timestamp: 1})

PostSchema.index({root_id: 1, has_deleted: 1, upvote_score: 1})

PostSchema.index({canonical_id: 1, has_deleted: 1, word_count: 1})

PostSchema.index({tags: 1, upvote_score: 1})

PostSchema.index({owner: 1, has_deleted: 1, upvote_score: -1})

PostSchema.index({has_deleted: 1, upvote_score: 1})

PostSchema.index({_id: 1, owner: 1})

PostSchema.index({upvote_score: -1})

PostSchema.index({has_deleted: 1, upvote_count: 1})

PostSchema.index({upvote_count: -1})

PostSchema.index({for_weekly_digest: 1, creation_timestamp: 1})

PostSchema.index({
    title: 'text',
    author_name: 'text'
}, {
    weights: {
        title           : 6,
        author_name     : 2
    },
    name: 'post_text_index'
})

/************************************************************************
 * Middleware
 ***********************************************************************/
//
// PostSchema.pre('save', function(next) {
//
//     if(!this.url_id){
//         Counter.getNext("post_url_id")
//         .then(post_url_id => {
//
//             this.url_id = post_url_id
//
//             next()
//         })
//     }
//     else {
//
//         next()
//     }
//
// })


/************************************************************************
 * Model
 ***********************************************************************/

const Post = mongoose.model('Post_V3', PostSchema)


/************************************************************************
 * Collection Events
 ***********************************************************************/

Post.on('index', error => {
    if(error) console.error('Post index error: %s', error)
})


/************************************************************************
 * Exports
 ***********************************************************************/

module.exports = Post
