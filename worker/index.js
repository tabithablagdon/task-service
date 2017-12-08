'use strict'

/************************************************************************
 * External Dependencies
 ***********************************************************************/
const cron    = require('cron');

const CronJob = cron.CronJob;

/************************************************************************
 * Internal Dependencies
 ***********************************************************************/
const logger  = require('../server/utils/logger.js');

/************************************************************************
 * Module
 ***********************************************************************/
function Worker(){
    // Hash table of all cron jobs
    this.jobs = new Map();

    /**
    * [addJob: Add a cronJob to jobs list]
    * @param  {[object]} job_data [object containing the follow fields]
        * @param  {[object]} job_name* [name of the cron job]
        * @param  {[string]} cron_time* [cron time]
        * @param  {[function]} on_tick* [function that runs when cron job starts]
        * @param  {[function]} on_complete  [function that fires when cron method .stop() is called]
        * @param  {[boolean]} start_now [true or false whether to start immediately]
        * @param  {[string]} timezone  [timezone]
    * @return {[boolean]}           [true or false if successful]
    */
    this.addJob = (job_data) => {
        // Validation params
        if (!job_data.job_name) return logger.error('Missing Parameter: job_name is required.');
        if (!job_data.cron_time) return logger.error('Missing Parameter: cron_time is required.');
        if (!job_data.on_tick) return logger.error('Missing Parameter: on_tick function is required.');
        if (!job_data.on_complete) on_complete = null;
        if (typeof job_data.start !== 'boolean') start = false;
        if (!job_data.timezone) timezone = 'America/Los_Angeles';

        // Check for duplicate jobs
        if (this.jobs.has(job_data.job_name)) return logger.error('Invalid Parameter: Job_name exists - check for duplicate jobs or use a different job name.');

        // Create new job
        const new_job = new CronJob(job_data.cron_time, job_data.on_tick, job_data.on_complete, job_data.start, job_data.timezone);

        this.jobs.set(job_data.job_name, new_job);

        logger.info(`Job ${job_data.job_name} successfully added to the job list.`);

        return true;
    };

    /**
    * [removeJob - Remove a job from the job list]
    * @param  {[string]} job_name [name of the job]
    * @return {[boolean]}          [true or false depending on if operation was successful]
    */
    this.removeJob = (job_name) => {
        if (this.jobs.has(job_name)) {
            this.jobs.delete(job_name);
            logger.info(`${job_name} successfully removed from the job list`);
            return true;
        } else {
            logger.info(`Remove Job Error: Job ${job_name} not found.`);
            return false;
        }
    };

    /**
     * [runJob - Runs one specified job]
     * @return {[boolean]} [description]
     */
    this.runJob = (job_name) => {
        if (this.jobs.size === 0) return;
        if (!job_name) return logger.error('Missing Parameter: Job name is required.');
        if (!this.jobs.has(job_name)) return logger.error(`Cannot run job ${job_name}. Job not found.`);

        this.jobs.get(job_name).start();
        logger.info(`Started job ${job_name}.`);

        return true;
    };

    /**
     * [runAllJobs - runs all jobs on the list]
     * @return {[boolean]} [description]
     */
    this.runAllJobs = () => {
        if (this.jobs.size === 0) return;

        this.jobs.forEach((job, job_name) => {
            job.start();
            logger.info(`Started job ${job_name}.`);
        });

        return true;
    };

    /**
     * [printAllJobs - print all jobs from the queue]
     * @return {[number]} [Get number of jobs]
     */
    this.printAllJobs = () => {
        const job_names = this.jobs.keys();

        logger.info(`${this.jobs.size} total jobs in queue.`);

        for (let name of job_names) {
            logger.info(`Job: ${name}`);
        }
    };

}



/************************************************************************
 * Public Export
 ***********************************************************************/
module.exports = new Worker();
