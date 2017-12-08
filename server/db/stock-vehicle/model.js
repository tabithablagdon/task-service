'use strict'

/************************************************************************
 * External Dependencies
 ***********************************************************************/
var mongoose 		         = require('mongoose')

/************************************************************************
 * Schema
 ***********************************************************************/
var Schema 			         = mongoose.Schema

var StockVehicleSchema 	 = Schema({
    make                : {
        type                : String,
        required            : true,
        index               : true,
    },

    model               : {
        type                : String,
        required            : true,
        index               : true,
    },

    year                : {
        type                : Number,
        required            : true,
        index               : true,
    },

    trim                : {
        type                : String,
        required            : true,
        index               : true,
    },

    default_image       : {
        // URLs of the image
        large_key           : {
            type                : String,
        },
        medium_key          : {
            type                : String,
        },
        thumb_key           : {
            type                : String,
        },
    },
    // factory data from Edmunds
    factory_data        : Object,

    // spec data
    acceleration_0to60  : String,
    condition           : Array,
    curbWeight          : String,
    drivenWheels        : String,
    engineCode          : String,
    engineCompressionRatio: Number,
    engineCompressionType: String,
    engineConfiguration : String,
    engineCylinder      : Number,
    engineDisplacement  : Number,
    engineForcedInduction: String,
    engineFuelType      : String,
    engineName          : String,
    engineSize          : Number,
    engineTotalValves   : Number,
    engineType          : String,
    fuelCapacity        : String,
    grossWeight         : Number,
    horsepower          : Number,
    luxury              : String,
    manufactureCode     : String,
    market              : String,
    mpgCity             : String,
    mpgCombined         : String,
    mpgHighway          : String,
    numberOfDoors       : String,
    performance         : String,
    price_baseInvoice   : Number,
    price_baseMSRP      : Number,
    price_deliveryCharges: Number,
    price_usedPrivateParty: Number,
    price_usedRetail    : Number,
    styleId             : Number,
    torque              : Number,
    transmissionGears   : String,
    transmissionType    : String,
    trimLong            : String,
    trimShort           : String,
    vehicle             : String,
    vehicleCategory     : String,
    vehicleSize         : String,
    vehicleStyle        : String,
    vehicleType         : String,
    whereBuilt          : String

})

/************************************************************************
 * Middleware
 ***********************************************************************/

StockVehicleSchema.virtual('default_image.large').get(function(){
    if(this.default_image.large_key){
        return 'https://wheelwell-stock-photos.s3.amazonaws.com/' + this.default_image.large_key
    } else{
        return null
    }
})

StockVehicleSchema.virtual('default_image.medium').get(function(){
    if(this.default_image.medium_key){
        return 'https://wheelwell-stock-photos.s3.amazonaws.com/' + this.default_image.medium_key
    } else{
        return null
    }
})

StockVehicleSchema.virtual('default_image.thumb').get(function(){
    if(this.default_image.thumb_key){
        return 'https://wheelwell-stock-photos.s3.amazonaws.com/' + this.default_image.thumb_key
    } else{
        return null
    }
})

StockVehicleSchema.set('toJSON', {
   virtuals: true
})

StockVehicleSchema.set('toObject', {
   virtuals: true
})


StockVehicleSchema.index({"make": 1, "model": 1, "trim": 1, "year": 1})


var StockVehicle = mongoose.model('StockVehicle', StockVehicleSchema)


/************************************************************************
 * CRUD Operations
 ***********************************************************************/


module.exports = StockVehicle
