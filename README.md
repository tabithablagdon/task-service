# Task Service

Microservice used to manage recurring jobs. New cron jobs can be added to worker, which starts all cron jobs in its queue automatically on server start.

## Built using:

[mongoose](http://mongoosejs.com/)  
[mongoDB](https://www.mongodb.com/)  
[Node.js](https://nodejs.org/en/)  
[Express](http://expressjs.com/)  
[cron](https://github.com/kelektiv/node-cron)   
[nodemailer](https://nodemailer.com)   
[axios](https://github.com/mzabriskie/axios)
[chalk](https://github.com/chalk/chalk)
[lodash](https://lodash.com)
[babel](https://babeljs.io/)
[winston](https://github.com/winstonjs/winston)

## File Structure

```
Task-Service
├── worker
│   ├──  cron-jobs
│   │    └── // cron-job templates/scripts the worker will be running
│   └── index.js // worker
│
├── node_modules
│   └── // Dependencies
│
├── server
│   ├── config
│   │   └── // Server configuration files
│   ├──  db
│   │    └── // Mongoose models and relationships for parser and api
│   └── server.js
│   
└── // Application dot files, READMEs, and configs
```

## Development

### Requirements

Node 6
- https://nodejs.org/en/

### Config

Environmental variables used:

* DATABASE_URI     - MongoDB database URI
* MAIL_SERVICE     - default: Gmail
* MAIL_USER        - mail user nodemailer emails are sent from
* MAIL_PASS        - password to mail user
* PORT             - default: 8000

### How To Start

* Start service locally using the below command:

```
DATABASE_URI=[MONGODB URI] MAIL_SERVICE=[EMAILSERVICE] MAIL_USER=[EMAIL] MAIL_PASS=[EMAIL_PASS] nodemon server/server.js --ignore node_modules/
```

* Create new cron jobs by filling out and exporting cron job object template in worker/cron-jobs - each cron job template can contain the follow keys (* require): job_name*, cron_time*, on_tick*, on_complete, start, timezone - see autofollow-new-users.js for example
* In /server/server.js, import your job in the "Jobs" section
* In /server/server.js, add new cron jobs to run to worker on server start in "Add Jobs to Worker" section:

```
Worker.addJob([INSERT_NAME_OF_YOUR_JOB])
```

### Worker instance methods

* Add Job

```
Worker.addJob([INSERT_NAME_OF_YOUR_JOB])
```

* Remove Job

```
Worker.removeJob([INSERT_NAME_OF_YOUR_JOB])
```

* Run Specific Job

```
Worker.runJob([INSERT_NAME_OF_YOUR_JOB])
```

* Run All Jobs (Server is set to run all jobs added to worker on start)

```
Worker.runAllJobs()
```

* Print list of all jobs the worker is queued to run

```
Worker.printAllJobs()
```
