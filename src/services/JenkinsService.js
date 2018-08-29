let Jenkins = require('jenkins');
let constants = require('../models/Constants');
let status = require('../models/statusCode');

function JenkinsService() {
    this.jenkins = Jenkins.Jenkins({
        "baseUrl": 'http://adeshpande@idfbins.com:9fd322b8fbd107bcf25543d8188fdf82@jenkins.idfbins.com',
        "crumbIssuer": true
    })
}

JenkinsService.prototype.serverInfo = function () {
    this.jenkins.info(function (err, data) {
        console.log(err);
        console.log(data);
    })
};

JenkinsService.prototype.getBuildStatus = function (postInRequest, flowdockJob, isPolling) {
    this.jenkins.job.get(flowdockJob.jobName, function (err, data) {
        if (err === null && data !== null) {
            switch (data.color) {
                case constants.BlueAnime:
                case constants.ABORTED_ANIME:
                    if (isPolling !== true) {
                        if (postInRequest === true) {
                            flowdockJob.jobThread.reply("Job is Running", status.JobRunning);
                        } else if (postInRequest === false) {
                            flowdockJob.objectionThread.reply("Job is Running", status.JobRunning);
                        } else {
                            flowdockJob.jobThread.reply("Job is Running", status.JobRunning);
                            flowdockJob.objectionThread.reply("Job is Running", status.JobRunning);
                        }
                    }
                    break;
                case constants.RED:
                    flowdockJob.jobStatus = status.Ended;
                    clearInterval(flowdockJob.jobTimer);
                    if (postInRequest === true) {
                        flowdockJob.jobThread.reply("Job Failed", status.JobFailed);
                    } else if (postInRequest === false) {
                        flowdockJob.objectionThread.reply("Job Failed", status.JobFailed);
                    } else {
                        flowdockJob.jobThread.reply("Job Failed", status.JobFailed);
                        flowdockJob.objectionThread.reply("Job Failed", status.JobFailed);
                    }

                    break;
                case constants.BLUE:
                    flowdockJob.jobStatus = status.Ended;
                    clearInterval(flowdockJob.jobTimer);
                    if (postInRequest === true) {
                        flowdockJob.jobThread.reply("Job is Complete", status.JobSuccess);
                    } else if (postInRequest === false) {
                        flowdockJob.objectionThread.reply("Job is Complete", status.JobSuccess);
                    } else {
                        flowdockJob.jobThread.reply("Job is Complete", status.JobSuccess);
                        flowdockJob.objectionThread.reply("Job is Complete", status.JobSuccess);
                    }
                    break;
                case constants.ABORTED:
                    flowdockJob.jobStatus = status.Ended;
                    clearInterval(flowdockJob.jobTimer);
                    if (postInRequest === true) {
                        flowdockJob.jobThread.reply("Job Aborted", status.Aborted);
                    } else if (postInRequest === false) {
                        flowdockJob.objectionThread.reply("Job Aborted", status.Aborted);
                    } else {
                        flowdockJob.jobThread.reply("Job Aborted", status.Aborted);
                        flowdockJob.objectionThread.reply("Job Aborted", status.Aborted);
                    }
                    break;
                default:
                    if (isPolling !== true) {
                        clearInterval(flowdockJob.jobTimer);
                        if (postInRequest === true) {
                            flowdockJob.jobThread.reply("Job Ended", status.Ended);
                        } else if (postInRequest === false) {
                            flowdockJob.objectionThread.reply("Job Ended", status.Ended);
                        } else {
                            flowdockJob.jobThread.reply("Job Ended", status.Ended);
                            flowdockJob.objectionThread.reply("Job Ended", status.Ended);
                        }
                    }
                    break;
            }
        }
    });
};


JenkinsService.prototype.getLastBuildNumber = function (jobName) {
    this.jenkins.job.get(jobName, function (err, data) {
        if (err === null && data !== null) {
            return data.lastBuild.number;
        }
    });

    return null;
};


module.exports = JenkinsService;