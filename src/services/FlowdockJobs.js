let ThreadMonitor = require('./ThreadMonitor');
let constants = require('../models/Constants');
let status = require('../models/statusCode');
let open = require('opn');
let JobTypes = require('../models/JobTypes');
let lastLines = require('read-last-line');
let fs = require('fs');
let Jenkins = require('./JenkinsService');

function FlowDockJob(jobType, message, session) {
    let jobNameStartsAt = message.content.indexOf("\`");
    let jobNameEndsAt = message.content.indexOf("\`", jobNameStartsAt + 1);
    this.jobName = message.content.substring(jobNameStartsAt + 1, jobNameEndsAt);
    this.buildID = null;
    this.jobID = null;
    this.jobStatus = status.Init;
    this.jobType = jobType;
    this.session = session;
    this.jobThread = new ThreadMonitor(session, message);
    this.objectionThread = null;
    this.requestedBy = message.user;
    this.hasBuildParameters = false;
    let that = this;
    session.get('/users/'.concat(message.user), {}, function (err, user, res) {
        that.requestedBy = user;
        that.jobID = jobType.toString().concat(user.id).concat()
    });
    this.objectionTimer = null;
    this.jobTimer = null;
    this.serverName = null;
    this.serverLogsPath = null;
    this.jenkinsService = new Jenkins();
    initiateJob(this);
    return this;
}

// private functions
function initiateJob(flowdockJob) {
    if (flowdockJob.hasServerName()) {
        flowdockJob.serverName = flowdockJob.jobName;
        flowdockJob.serverLogsPath = getLogsPath(flowdockJob);
        switch (flowdockJob.jobType) {
            case JobTypes.BuildDeploy:
                flowdockJob.askConfirmationFromUser();
                break;
            case JobTypes.Logs:
                flowdockJob.jobStatus = status.Ready;
                flowdockJob.jobThread.reply(constants.ReadingLogs);
                break;
            case JobTypes.Docs:
                flowdockJob.jobStatus  = status.Ready;
                flowdockJob.jobThread.reply(constants.Checking);
                break;
            default:
                flowdockJob.jobThread.reply(constants.InvalidNameTerminate);
                break;
        }
    } else {
        flowdockJob.jobThread.reply(constants.InvalidNameTerminate);
        flowdockJob.jobStatus = status.Ended;
    }
}

function getLogsPath(flowdockJob) {
    switch (flowdockJob.serverName) {
        case constants.CC8DEV:
            return constants.CC8DEVLogPath;
        case constants.CC8UAT:
            return constants.CC8UATLogPath;
        case constants.CC8BUAT:
            return constants.CC8BUATLogPath;
        default:
            return null;
    }
}

FlowDockJob.prototype.isReplyOnRequesterThread = function (message) {
    return this.jobThread.threadID === message.thread_id;
};

FlowDockJob.prototype.hasServerName = function () {
    return this.jobName.trim().length > 0
};

FlowDockJob.prototype.askConfirmationFromUser = function () {
    if (this.hasServerName()) {
        this.jobThread.reply(constants.ConfirmationRequestMessage, status.WaitingForConfirmation);
        this.jobStatus = status.WaitingForConfirmation;
    }
};

FlowDockJob.prototype.verifyConfirmationInMessage = function (message) {
    if (this.jobThread.isReplyOnThisThread(message)) {
        if (this.isReplyFromRequester(message)) {
            if (message.content.toUpperCase().replace(new RegExp('`', 'g'), "") === "YES") {
                return true;
            } else if (message.content.toUpperCase().replace(new RegExp('`', 'g'), "") === "NO") {
                return false;
            } else {
                this.jobThread.reply(constants.YesNoUserMessage);
                return null
            }
        } else {
            this.jobThread.reply("Only @".concat(this.requestedBy.nick).concat(" Can Confirm the request."));
            return null
        }
    }

    return null
};

FlowDockJob.prototype.checkForObjectionsInMessage = function (message) {
    if (this.objectionThread !== null && this.objectionThread.isReplyOnThisThread(message)) {
        if (message.content.toUpperCase().replace(new RegExp('`', 'g'), "") === "STOP" || message.content.toUpperCase().replace(new RegExp('`', 'g'), "") === "NO") {
            return true;
        } else if (message.content.toUpperCase() === "YES") {
            return null;
        } else {
            this.jobThread.reply(constants.NonConversationalMessage);
        }
    } else if (this.jobThread.isReplyOnThisThread(message)) {
        if (message.content.toUpperCase().replace(new RegExp('`', 'g'), "") === "OVERRIDE") {
            if (this.isReplyFromRequester(message)) {
                return false
            } else {
                this.jobThread.reply("[Invalid User] Override can be requested @".concat(this.requestedBy.nick).concat(" only."));
            }
        } else {
            this.jobThread.reply(constants.NonConversationalMessage);
        }
    }
};

FlowDockJob.prototype.checkForInterrupts = function (message) {
    if (this.jobThread.isReplyOnThisThread(message)) {
        if (message.content.toUpperCase().replace(new RegExp('`', 'g'), "") === "STOP" || message.content.toUpperCase().replace(new RegExp('`', 'g'), "") === "END") {
            this.jobThread.reply("Killing Jobs not supported right now.")
        } else if (message.content.toUpperCase().replace(new RegExp('`', 'g'), "") === "STATUS") {
            let status = this.checkStatus(message, true);
        } else if (this.hasRedirectCommand(message)) {
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
    if (shouldPrintStatus) {
        if (message !== null) {
            if (this.objectionThread != null && this.objectionThread.isReplyOnThisThread(message)) {
                this.jenkinsService.getBuildStatus(false, this);
            }

            if (this.jobThread.isReplyOnThisThread(message)) {
                this.jenkinsService.getBuildStatus(true, this);
            }
        } else {
            this.jenkinsService.getBuildStatus(null, this);
        }
    } else {
       this.jenkinsService.getBuildStatus(null, this, true);
    }
    return this.jobStatus;
};

FlowDockJob.prototype.terminateJob = function (redirect) {
    console.log("Terminating");
    let that = this;
    this.jobStatus = status.Ended;
    this.jenkinsService.jenkins.build.stop([this.jobName, this.buildID], function (err) {
        if( err === null ){
            that.jobThread.reply("Job Terminated.");
            that.objectionThread.reply("Job Terminated.");
        }
    });

    return true;
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

FlowDockJob.prototype.getJenkinsJobName = function(){
    switch (this.jobName) {
        case constants.CC_CI:
        case constants.CC8DEV:
            return constants.CC_CIUrl;
        case constants.CC_RB:
        case constants.CC8UAT:
            return constants.CC_RBUrl;
        default:
            return constants.TestJobUrl;
    }
};

FlowDockJob.prototype.hasRedirectCommand = function(message){
    let shouldRedirect = message.content.toUpperCase().replace(new RegExp('`', 'g'), "") === "REDIRECT";
    if(shouldRedirect){
        this.jobThread.reply("Redirecting to jenkins");
    } else {
        return shouldRedirect;
    }
};

FlowDockJob.prototype.handleBuildDeployJob = function (message, monitorThreads) {
    switch (this.jobStatus) {
        case status.Ended:
            if (message.content !== "This Thread is no longer monitored.") {
                this.jobThread.reply("This Thread is no longer monitored.");
                monitorThreads.delete(message.thread_id);
            }
            break;
        case status.WaitingForConfirmation:
            let hasConfirmation = this.verifyConfirmationInMessage(message);
            if (hasConfirmation === true) {
                this.startTimerForJob(constants.JobStartTimeOut);
                this.jobThread.reply(constants.ConfirmationAckMessage, status.CanOverrideTAG);
                this.jobName = this.getJenkinsJobName();
                let objectionsMessage = "Need to start build/deploy on".concat(this.jobName).concat(", Reply `No` or `Stop` to stop the process. If no objections received in ***15 min***, build/deploy will start automatically");
                this.postObjectionsInFlow(monitorThreads, constants.fakeServerUpdates, objectionsMessage);
                this.jobStatus = status.WaitingObjections;
            } else if (hasConfirmation === false) {
                this.jobThread.reply(constants.RequestTermninated);
                this.jobStatus = status.Ended;
            } else {
                // do nothing
            }
            break;
        case status.WaitingObjections:
            let objections = this.checkForObjectionsInMessage(message);

            // true = objection posted in the objection thread
            if(objections === true){
                this.jobStatus = status.Ended;
                clearTimeout(this.objectionTimer);
                this.objectionThread.reply("Cancelling build/deploy request, notifying requester.");
                this.jobThread.reply("Objection Received in Server Updates group. Cancelling Build/Deploy Request.");

            }
            // false = requester has issued override
            if(objections === false){
                this.objectionThread.reply("@".concat(this.requestedBy.nick).concat(" - Requester has issued an override - Starting Job `").concat(this.jobName).concat("`"));
                clearTimeout(this.objectionTimer);
                this.jobThread.reply("Override Confirmed, Starting Job `".concat(this.jobName).concat("`, will notify the build status"));
                this.startJob();
            }
            break;
        case status.JobRunning:
            this.checkForInterrupts(message);
            break;
        case status.JobSuccess:
            this.jobStatus = status.Ended;
            if(this.hasRedirectCommand(message)){
                this.redirectToJenkins();
            }

            break;
        case status.JobFailed:
            this.jobStatus = status.Ended;
            if(this.hasRedirectCommand(message)){
                this.redirectToJenkins();
            }

            break;
    }
};

FlowDockJob.prototype.handleLogsJob = function (message, monitorThreads) {
    switch (this.jobStatus) {
        case status.Ended:
            if (message.content !== "This Thread is no longer monitored.") {
                this.jobThread.reply("This Thread is no longer monitored.");
                monitorThreads.delete(message.thread_id);
            }
            break;
        case status.Ready:
            let that = this;
            lastLines.read(this.serverLogsPath.toString(), 50).then(function (lines) {
                that.jobThread.reply(lines);
                that.jobStatus = status.JobSuccess;
            }).catch(function (error) {
                that.jobStatus = status.JobFailed;
                that.jobThread.reply(lines);
            });
            break;
        case status.JobSuccess:
            if(this.isReplyFromRequester(message)){
                if(message.content.toUpperCase().replace(new RegExp('`', 'g'), "") === "REDIRECT"){
                    open(this.serverLogsPath);
                } else if (message.content.toUpperCase().replace(new RegExp('`', 'g'), "") === "END"){
                    this.jobStatus = status.Ended;
                    this.jobThread.reply("Transaction Ended.");
                }
            }
            break;
        default:
            this.jobThread.reply(constants.RequestTermninated);

    }
};


FlowDockJob.prototype.handleDocsJob = function (message, monitorThreads) {
    switch (this.jobStatus) {
    case status.Ended:
        if (message.content !== "This Thread is no longer monitored.") {
            this.jobThread.reply("This Thread is no longer monitored.");
            monitorThreads.delete(message.thread_id);
        }
        break;
    case status.Ready:
        switch (this.jobName) {
            case constants.CC:
                this.jobStatus = status.Ended;
                open(constants.CCDocs);
                break;
            case constants.PC:
                this.jobStatus = status.Ended;
                open(constants.PCDocs);
                break;
            case constants.BC:
                this.jobStatus = status.Ended;
                open(constants.BCDocs);
                break;
            case constants.Portals:
                this.jobStatus = status.Ended;
                open(constants.PortalDocs);
                break;
            default:
                this.jobStatus = status.Ended;
                this.jobThread.reply("Could Not Find Documentation for :".concat(this.jobName));
                break;

        }
        break;
    case status.JobSuccess:
        if(this.isReplyFromRequester(message)){
            if(message.content.toUpperCase().replace(new RegExp('`', 'g'), "") === "REDIRECT"){
                open(this.serverLogsPath);
            } else if (message.content.toUpperCase().replace(new RegExp('`', 'g'), "") === "END"){
                this.jobStatus = status.Ended;
                this.jobThread.reply("Transaction Ended.");
            }
        }
        break;
    default:
        this.jobThread.reply(constants.RequestTermninated);

    }
};

function startJob(flowdockJob) {
    // stating jenkins job
    if(flowdockJob.hasBuildParameters){
        flowdockJob.jenkinsService.jenkins.job.buildWithParams(flowdockJob.jobName, {}, function (err, data) {
            if(err !== null){
                console.log(data);
                flowdockJob.jobStatus = status.JobRunning;
                flowdockJob.jobThread.reply("Job ".concat(flowdockJob.jobName).concat(" Has been Started Please reply \n `Status` to check the latest status of the job"), status.JobRunning);
                flowdockJob.objectionThread.reply("Job ".concat(flowdockJob.jobName).concat(" Has been Started Please reply \n `Status` to check the latest status of the job"), status.JobRunning);
            } else {
                console.log(err)
            }
        })
    } else {
        flowdockJob.jenkinsService.jenkins.job.build(flowdockJob.jobName, function (err, data) {
            if(data !== null){
                flowdockJob.jobStatus = status.JobRunning;
                flowdockJob.jobThread.reply("Job ".concat(flowdockJob.jobName).concat(" Has been Started Please reply \n `Status` to check the latest status of the job"), status.JobRunning);
                flowdockJob.objectionThread.reply("Job ".concat(flowdockJob.jobName).concat(" Has been Started Please reply \n `Status` to check the latest status of the job"), status.JobRunning);
                flowdockJob.buildID = flowdockJob.jenkinsService.getLastBuildNumber(flowdockJob.jobName);
            } else {
                flowdockJob.jobStatus = status.JobFailed;
                flowdockJob.jobThread.reply("Failed to start the job.", status.JobFailed);
                flowdockJob.objectionThread.reply("Job Failed. Requester has been notified.");
                console.log(err);
            }
        });
    }


    flowdockJob.jobTimer = setInterval(function () {
        flowdockJob.checkStatus(null, false, true);
    }, constants.StatusCheckTimeout);

}


module.exports = FlowDockJob;