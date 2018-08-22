let ThreadMonitor = require('./ThreadMonitor');
let status = require('../models/statusCode');

function FlowDockJob(jobType, message, session) {
    this.jobName = "TestJobName";
    this.jobStatus = status.Init;
    this.jobType = jobType;
    this.session = session;
    this.jobThreadMonitor = new ThreadMonitor(session, message);
    this.objectionThreadMonitor = null;
    this.requestedBy = message.user;
    this.timer = null;
    return this;
}

FlowDockJob.prototype.isReplyOnRequesterThread = function (message) {
    return this.jobThreadMonitor.threadID === message.thread_id;
};

FlowDockJob.prototype.newFlowDockJob= function FlowDockJob(jobType, message, session) {
    this.jobName = "TestJobName";
    this.jobStatus = status.Init;
    this.jobType = jobType;
    this.session = session;
    this.jobThreadMonitor = new ThreadMonitor(session, message);
    this.objectionThreadMonitor = null;
    this.requestedBy = message.user;
    this.timer = null;
    
};

FlowDockJob.prototype.isReplyOnRequesterThread= function (message) {
    return this.jobThreadMonitor.threadID === message.thread_id;
};

FlowDockJob.prototype.isReplyOnObjectionsThread= function (message) {
    return this.objectionThreadMonitor.threadID === message.thread_id;
};

FlowDockJob.prototype.createObjectionThreadMonitor= function (message) {
    this.objectionThreadMonitor = new ThreadMonitor(this.session, message);
    return this
};

FlowDockJob.prototype.postMessageInFlow= function (flowID, description, tags) {
    if (!(tags instanceof Array)) {
        tags = [tags]
    }
    this.session.message(flowID, description, tags);
    
};

FlowDockJob.prototype.postObjectionsInFlow= function (monitorThreads, flowID, description, tags) {

    if (!(tags instanceof Array)) {
        tags = [tags];
        if (tags.indexOf(status.WaitingObjections === -1)) {
            tags.push(status.WaitingObjections);
        }
    }

    let that = this;
    this.session.message(flowID, description, tags, function(err, message, res){
       that.objectionThreadMonitor = new ThreadMonitor(that.session, message);
       monitorThreads.set(that.objectionThreadMonitor.threadID, that);
    });
};

FlowDockJob.prototype.RequestedBy= function () {
    return this.requestedBy;
};

FlowDockJob.prototype.startTimerForJob= function (time) {
    let that = this;
    this.timer = setTimeout(function () {
        startJob(that);
    }, time);
    
};

FlowDockJob.prototype.startJob = function(){
    startJob(this);
};

function startJob(flowdockJob) {
    console.log("Starting JobName ".concat(flowdockJob.jobName));
    flowdockJob.jobStatus = status.JobStart;
    flowdockJob.jobThreadMonitor.replyOnThread("Job ".concat(flowdockJob.jobName).concat(" Has been Started"), status.JobRunning);
    flowdockJob.objectionThreadMonitor.replyOnThread("Job ".concat(flowdockJob.jobName).concat(" Has been Started"), status.JobRunning);
    
}



module.exports = FlowDockJob;