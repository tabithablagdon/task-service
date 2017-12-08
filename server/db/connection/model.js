'use strict'

/************************************************************************
 * External Dependencies
 ***********************************************************************/
const mongoose = require('mongoose');

/************************************************************************
 * Schema
 ***********************************************************************/
const Schema = mongoose.Schema;

const ConnectionSchema = Schema({
    connection_type: {
        type: String,
        enum: ['FOLLOW', 'LIKE', 'ADMIN'],
        required: true
    },
    // Requestor User = connection[0], Receiver User = connection[1]
    connection: [{
        // Collection name
        object_type: {
            type: String,
            enum: ['Comment', 'User', 'Vehicle']
        },
        object_id: {
          type: Schema.Types.ObjectId,
          ref: 'User'
          // refPath: 'connection.1.object_type'
        }
    }],

    creation_timestamp  : {
        type                : Date,
        required            : true,
        default             : Date.now,
    },

});

/************************************************************************
 * Indexes
 ***********************************************************************/

ConnectionSchema.index({'connection.object_id': 1, 'connection_type': 1});

ConnectionSchema.index({ "connection.0.object_id" : 1 , "connection.1.object_id" : 1 , "connection_type" : 1}, {unique : true})

ConnectionSchema.index({"connection.1.object_id": 1, "connection.1.object_type": 1, "connection_type": 1})


/************************************************************************
 * Model
 ***********************************************************************/

const Connection = mongoose.model('Connection', ConnectionSchema);

Connection.on('index', error => {
    console.log('Connection model indexed')
    if (error) {
        console.error(`Connection index error: ${error}`);
    }
})

/************************************************************************
 * Exports
 ***********************************************************************/

module.exports = Connection
