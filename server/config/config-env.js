'use strict'

/************************************************************************
 * External Dependencies
 ***********************************************************************/
const nodemailer = require('nodemailer');
const path       = require('path');

/************************************************************************
 * Module
 ***********************************************************************/
const base_env = {
    'database_uri': process.env.DATABASE_URI,
    'db_timeout': process.env.DB_TIMEOUT || 30000,
    'dev_email_list': 'tabitha.blagdon@gmail.com', // Can use environment variables here
    'produ_email_list': 'tabitha.blagdon@gmail.com',
    'env': process.env.NODE_ENV || 'development',
    'mail_user': process.env.MAIL_USER,
    'mandrill_api_key': process.env.MANDRILL_API_KEY,
    'port': process.env.PORT || 8000,
    'transporter': nodemailer.createTransport({
        'service': process.env.MAIL_SERVICE || 'Gmail',
        'auth': {
            'user': process.env.MAIL_USER,
            'pass': process.env.MAIL_PASS
        }
    })
};

/************************************************************************
 * Public Export
 ***********************************************************************/
module.exports = base_env;
