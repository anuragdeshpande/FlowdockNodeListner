let Session = require('flowdock').Session;
let JobTypes = require('./src/models/JobTypes');
let FlowDockJob = require('./src/services/FlowdockJobs');
let JenkinsService = require('./src/services/JenkinsService');
let status = require('./src/models/statusCode');
let constants = require('./src/models/Constants');
let session = new Session("1ec2e89731ea0718a85bb5fd45bf4483");

let monitorThreads = new Map();

// listen on all flows for @bot call
session.flows(function (err, flows) {
    let anotherStream, flowIds;
    flowIds = flows.map(function (f) {
        return f.id;
    });
    anotherStream = session.stream(flowIds);
    return anotherStream.on('message', function (message) {
        if (message.event === "message") {
            let jenkins = new JenkinsService();
            // jenkins.jenkins.job.get(constants.CC_CIUrl, function (err, data) {
            //     console.log(data.lastBuild);
            //     console.log(data.lastCompletedBuild);
            //     console.log(data.lastFailedBuild);
            //     console.log(data.lastStableBuild);
            //     console.log(data.lastSuccessfulBuild);
                // console.log(data.color)
            // });
            if (message.content.startsWith("@Bot") || message.content.startsWith("@bot")) {
                if(message.content.indexOf('#') !== -1) {
                    message.tags.forEach(function (tag) {
                        if (!tag.toString().startsWith(":")) {
                            let flowDockJob = null;
                            switch (tag.toLowerCase()) {
                                case JobTypes.BuildDeploy:
                                    flowDockJob = new FlowDockJob(JobTypes.BuildDeploy, message, session);
                                    break;
                                case JobTypes.JenkinsJob:
                                    console.log("Prepare Jenkins Job");
                                    break;
                                case JobTypes.RegressionStatus:
                                    flowDockJob = new FlowDockJob(JobTypes.RegressionStatus, message, session);
                                    console.log(message);
                                    break;
                                case JobTypes.Logs:
                                    flowDockJob = new FlowDockJob(JobTypes.Logs, message, session);
                                    break;
                                case JobTypes.Docs:
                                    flowDockJob = new FlowDockJob(JobTypes.Docs, message, session);
                                    break;
                                case 'flowID':
                                    break;
                                default:
                                    flowDockJob = new FlowDockJob(JobTypes.BuildDeploy, message, session);
                                    flowDockJob.jobThread.reply(constants.NonConversationalMessage);
                            }
                            if (flowDockJob.jobStatus !== status.Ended) {
                                monitorThreads.set(message.thread_id, flowDockJob);
                            }
                        }
                    });
                } else {
                    if(message.content.toUpperCase().indexOf("HI") !== -1 || message.content.toUpperCase().indexOf("HI") !== -1 ||
                        message.content.toUpperCase().indexOf("GOOD MORNING") !== -1 || message.content.toUpperCase().indexOf("SPEAK") !== -1
                    || message.content.toUpperCase().indexOf("HOW") !== -1 || message.content.toUpperCase().indexOf("WHAT") !== -1){
                        if(message.content.toUpperCase().indexOf("WHAT CAN YOU DO" !== -1)){
                            session.threadMessage(message.flow, message.thread_id, constants.WhatCanYouDo);
                        } else{
                            session.threadMessage(message.flow, message.thread_id, "Good Day to you too, before you try and talk any further, ".concat(constants.NonConversationalMessage))
                        }

                    } else {
                        session.threadMessage(message.flow, message.thread_id, constants.NonConversationalMessage);
                    }

                }
            } else if (monitorThreads.has(message.thread_id)) {
                let flowDockJob = monitorThreads.get(message.thread_id);
                switch (flowDockJob.jobType) {
                    case JobTypes.BuildDeploy:
                        flowDockJob.handleBuildDeployJob(message, monitorThreads);
                        break;
                    case JobTypes.Logs:
                        flowDockJob.handleLogsJob(message, monitorThreads);
                        break;
                    case JobTypes.Docs:
                        flowDockJob.handleDocsJob(message, monitorThreads);
                        break;
                }
            }
        }
    });
});

// if(message.content!== null && message.content.trim()!== "" && message.content.trim()=== "//bot clockmove qa"){
//     jenkins.job.build({name: 'Clock Move Tool', parameters:{"ServerToChange": "QA"}}, function (err, data) {
//        if(err){
//            if(err.res.beanStatus().startsWith("Invalid password/token for user")){
//                session.comment(jenkinsFlowID, message.id, "Failed: Invalid Password - Please check your system property");
//            }
//        } else {
//            session.comment(jenkinsFlowID, message.id, "Clock Move on QA complete");
//        }
//        console.log(data);
//     });
//
// }



