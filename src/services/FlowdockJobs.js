let ThreadMonitor = require('./ThreadMonitor');
let constants = require('../models/Constants');
let status = require('../models/statusCode');
let open = require('opn');

function FlowDockJob(jobType, message, session) {
    let jobNameStartsAt = message.content.indexOf("\`");
    let jobNameEndsAt = message.content.indexOf("\`", jobNameStartsAt + 1);
    this.jobName = message.content.substring(jobNameStartsAt + 1, jobNameEndsAt);
    this.jobID = null;
    this.jobStatus = status.Init;
    this.jobType = jobType;
    this.session = session;
    this.jobThread = new ThreadMonitor(session, message);
    this.objectionThread = null;
    this.requestedBy = message.user;
    let that = this;
    session.get('/users/'.concat(message.user), {}, function (err, user, res) {
        that.requestedBy = user;
        that.jobID = jobType.toString().concat(user.id).concat()
    });
    this.objectionTimer = null;
    this.jobTimer = null;
    if (!this.hasValidJobName()) {
        this.jobThread.reply("Request Terminated.");
        this.jobStatus = status.Ended;
    } else {
        this.askConfirmationFromUser();
    }
    return this;
}

FlowDockJob.prototype.isReplyOnRequesterThread = function (message) {
    return this.jobThread.threadID === message.thread_id;
};

FlowDockJob.prototype.hasValidJobName = function () {
    return this.jobName.trim().length > 0
};

FlowDockJob.prototype.askConfirmationFromUser = function () {
    if (this.hasValidJobName()) {
        this.jobThread.reply(constants.ConfirmationRequestMessage, status.WaitingForConfirmation);
        this.jobStatus = status.WaitingForConfirmation;
    }
};

FlowDockJob.prototype.verifyConfirmationInMessage = function (message, monitorThreads) {
    if (this.jobThread.isReplyOnThisThread(message)) {
        if (this.isReplyFromRequester(message)) {
            if (message.content.toUpperCase().replace(new RegExp('`', 'g'), "") === "YES") {
                this.startTimerForJob(constants.JobStartTimeOut);
                this.jobThread.reply(constants.ConfirmationAckMessage, status.CanOverrideTAG);
                this.postObjectionsInFlow(monitorThreads, constants.fakeServerUpdates, constants.ObjectionsMessage);

                this.jobStatus = status.WaitingObjections;
            } else if (message.content.toUpperCase().replace(new RegExp('`', 'g'), "") === "NO") {
                this.jobThread.reply("Request Terminated.");
                this.jobStatus = status.Ended;
            } else {
                this.jobThread.reply(constants.YesNoUserMessage);
            }
        } else {
            this.jobThread.reply("Only @".concat(this.requestedBy.nick).concat(" Can Confirm the request."))
        }
    }
};

FlowDockJob.prototype.checkForObjectionsInMessage = function (message) {
    if (this.objectionThread !== null && this.objectionThread.isReplyOnThisThread(message)) {
        if (message.content.toUpperCase().replace(new RegExp('`', 'g'), "") === "STOP" || message.content.toUpperCase().replace(new RegExp('`', 'g'), "") === "NO") {
            clearTimeout(this.objectionTimer);
            this.objectionThread.reply("Cancelling build/deploy request, notifying requester.");
            this.jobThread.reply("Objection Received in Server Updates group. Cancelling Build/Deploy Request.");
            this.jobStatus = status.Ended;
        } else if (message.content.toUpperCase() === "YES") {
            // do nothing
        } else {
            this.jobThread.reply(constants.NonConversationalMessage);
        }
    } else if (this.jobThread.isReplyOnThisThread(message)) {
        if (message.content.toUpperCase().replace(new RegExp('`', 'g'), "") === "OVERRIDE") {
            if (this.isReplyFromRequester(message)) {
                this.objectionThread.reply("@".concat(this.requestedBy.nick).concat(" -Requester has issued an override - Starting Job `").concat(this.jobName).concat("`"));
                clearTimeout(this.objectionTimer);
                this.jobThread.reply("Override Confirmed, Starting Job `".concat(this.job).concat("`, will notify the build status. You can Check the Status anytime with in this thread by replying \"status\""));
                this.startJob();
            } else {
                this.jobThread.reply("[Invalid User] Override can be requested @".concat(this.requestedBy.nick).concat(" only."));
            }
        }  else {
            this.jobThread.reply(constants.NonConversationalMessage);
        }
    }
};

FlowDockJob.prototype.checkForInterrupts = function (message) {
    if (this.jobThread.isReplyOnThisThread(message)) {
        if (message.content.toUpperCase().replace(new RegExp('`', 'g'), "") === "STOP" || message.content.toUpperCase().replace(new RegExp('`', 'g'), "") === "END") {
            this.terminateJob(false);
        } else if (message.content.toUpperCase().replace(new RegExp('`', 'g'), "") === "STATUS") {
            let status = this.checkStatus(message, true);
        } else if (message.content.toUpperCase().replace(new RegExp('`', 'g'), "") === "REDIRECT") {
            this.terminateJob(true);
        } else {
            this.jobThread.reply(constants.NonConversationalMessage);
        }
    }
};

FlowDockJob.prototype.redirectToJenkins = function () {
    open("https://jenkins.idfbins.com");
};


FlowDockJob.prototype.checkStatus = function (message, shouldPrintStatus) {
    //todo complete checkStatus
    if (shouldPrintStatus) {
        if (message !== null) {
            if (this.objectionThread != null && this.objectionThread.isReplyOnThisThread(message)) {
                this.objectionThread.reply("Job ".concat(this.jobStatus))
            }

            if (this.jobThread.isReplyOnThisThread(message)) {
                this.jobThread.reply("Job ".concat(this.jobStatus));
            }
        } else {
            this.objectionThread.reply(this.jobStatus);
            this.jobThread.reply(this.jobStatus);
        }
    } else {
        // do nothing.
    }
    return this.jobStatus;
};

FlowDockJob.prototype.terminateJob = function (redirect) {
    // todo comeplete terminate job
    let status = true;
    this.jobThread.reply("Job Termination ".concat(status ? "Successful" : "Failed, Please terminate the job Manually. Redirecting you to jenkins....."));
    this.objectionThread.reply("Job Ended.");
    if (!status) {
        this.objectionThread.reply("Job Ended with Failure. Concerned team has been notified.");
        redirect = true;
    }

    if (redirect) {
        this.jobThread.reply("Redirecting to jenkins");
        this.redirectToJenkins();
    }
    this.jobStatus = status.Ended;
    return true;
};

FlowDockJob.prototype.newFlowDockJob = function FlowDockJob(jobType, message, session) {
    this.jobName = "TestJobName";
    this.jobStatus = status.Init;
    this.jobType = jobType;
    this.session = session;
    this.jobThread = new ThreadMonitor(session, message);
    this.objectionThread = null;
    this.requestedBy = message.user;
    this.objectionTimer = null;

};

FlowDockJob.prototype.isReplyOnRequesterThread = function (message) {
    return this.jobThread.threadID === message.thread_id;
};

FlowDockJob.prototype.isReplyOnObjectionsThread = function (message) {
    return this.objectionThread.threadID === message.thread_id;
};

FlowDockJob.prototype.createObjectionThreadMonitor = function (message) {
    this.objectionThread = new ThreadMonitor(this.session, message);
    return this
};

FlowDockJob.prototype.postMessageInFlow = function (flowID, description, tags) {
    if (!(tags instanceof Array)) {
        tags = [tags]
    }
    this.session.message(flowID, description, tags);

};

FlowDockJob.prototype.postObjectionsInFlow = function (monitorThreads, flowID, description, tags) {

    if (!(tags instanceof Array)) {
        tags = [tags];
        if (tags.indexOf(status.WaitingObjections === -1)) {
            tags.push(status.WaitingObjections);
        }
    }

    let that = this;
    this.session.message(flowID, description, tags, function (err, message, res) {
        that.objectionThread = new ThreadMonitor(that.session, message);
        monitorThreads.set(that.objectionThread.threadID, that);
    });
    this.jobThread.hasPendingConfirmation = false;
    this.jobStatus = status.WaitingObjections;
};

FlowDockJob.prototype.RequestedBy = function () {
    return this.requestedBy;
};

FlowDockJob.prototype.startTimerForJob = function (time) {
    let that = this;
    this.objectionTimer = setTimeout(function () {
        startJob(that);
    }, time);

};

FlowDockJob.prototype.startJob = function () {
    startJob(this);
};

FlowDockJob.prototype.isReplyFromRequester = function (message) {
    return this.requestedBy.id.toString() === message.user && message.user !== '349549';
};

function startJob(flowdockJob) {
    flowdockJob.jobStatus = status.JobRunning;
    flowdockJob.jobTimer = setInterval(function () {
        let jobStatus = flowdockJob.checkStatus(false);
        if (jobStatus === status.JobRunning) {
            // do nothing
        } else if (jobStatus === status.JobSuccess) {
            flowdockJob.checkStatus(null, true);
        } else if (jobStatus === status.JobFailed) {
            flowdockJob.checkStatus(null, true);
        }
    }, constants.StatusCheckTimeout);
    flowdockJob.jobThread.reply("Job ".concat(flowdockJob.jobName).concat(" Has been Started Please reply \n 1. `Status` to check the latest status of the job \n 2. `Stop` or `End` to terminate the job."), status.JobRunning);
    flowdockJob.objectionThread.reply("Job ".concat(flowdockJob.jobName).concat(" Has been Started Please reply \n `Status` to check the latest status of the job"), status.JobRunning);

}


module.exports = FlowDockJob;