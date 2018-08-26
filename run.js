let Session = require('flowdock').Session;
let JobTypes = require('./src/models/JobTypes');
let FlowDockJob = require('./src/services/FlowdockJobs');
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
                                case JobTypes.Logs:
                                    flowDockJob = new FlowDockJob(JobTypes.Logs, message, session);
                                    break;
                                case JobTypes.Docs:
                                    flowDockJob = new FlowDockJob(JobTypes.Docs, message, session);
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
                            session.threadMessage(message.flow, message.thread_id, "Good Day to you too, before you try and talk any further, ".concat(constants.NonConversationalMessage));
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

                // if (message.content.toUpperCase() === "YES") {
                //     if (flowDockJob.objectionThread !== null && flowDockJob.objectionThread.isReplyOnThisThread(message)) {
                //         // do nothing
                //     } else if (flowDockJob.jobThread.isReplyOnThisThread(message)) {
                //         if (flowDockJob.isReplyFromRequester(message)) {
                //             if (flowDockJob.jobThread.hasPendingConfirmation) {
                //                 let objectionsThreadID = flowDockJob.postObjectionsInFlow(monitorThreads, fakeServerUpdates, "[Testing - Ignore] Need to start build/deploy on [Server], Reply No/Stop to stop the process. If no objections received in 15 min, build/deploy will start automatically");
                //                 monitorThreads.set(objectionsThreadID, flowDockJob);
                //                 flowDockJob.startTimerForJob(timer.JobStartTimeOut);
                //                 flowDockJob.jobThread.reply("Build Deploy Confirmed, Posted in Server Updates, if no objections will start the build/deploy in 15 min. \n to immediately start the process reply \"override\"", status.CanOverrideTAG);
                //             } else {
                //                 flowDockJob.jobThread.reply("Thread is not waiting on confirmation. Current Status: ".concat(flowDockJob.jobThread.jobStatus));
                //             }
                //         } else {
                //             flowDockJob.jobThread.reply("Only @".concat(flowDockJob.requestedBy.nick).concat(" Can Confirm the request."))
                //         }
                //     } else {
                //         session.threadMessage(message.flow, message.thread_id, "[Invalid User] Only Requester can confirm")
                //     }
                // } else if (message.content.toUpperCase() === "NO") {
                //     if (flowDockJob.objectionThread.isReplyOnThisThread(message)) {
                //         if (flowDockJob.jobThread.jobStatus === status.CanOverrideTAG) {
                //             flowDockJob.objectionThread.reply("Cancelling build/deploy request, notifying requester.");
                //             flowDockJob.jobThread.reply("Objection Received in Server Updates group. Cancelling Build/Deploy Request.");
                //         } else if (flowDockJob.jobThread.jobStatus === status.JobRunning) {
                //             flowDockJob.objectionThread.reply("Job has been started.")
                //         }
                //     } else if (flowDockJob.jobThread.isReplyOnThisThread(message)) {
                //         if (flowDockJob.isReplyFromRequester(message)) {
                //             if (flowDockJob.jobThread.hasPendingConfirmation) {
                //                 let objectionsThreadID = flowDockJob.postObjectionsInFlow(fakeServerUpdates, "[Testing - Ignore] Need to start build/deploy on [Server], Reply No/Stop to stop the process. If no objections received in 15 min, build/deploy will start automatically");
                //                 monitorThreads.set(objectionsThreadID, flowDockJob);
                //             } else {
                //                 flowDockJob.jobThread.reply("Thread is not waiting on confirmation.")
                //             }
                //         }
                //     } else {
                //         session.threadMessage(message.flow, message.thread_id, "[Invalid User] Only Requester can confirm")
                //     }
                // } else if (message.content.toUpperCase() === "OVERRIDE") {
                //     if (flowDockJob.jobThread.isReplyOnThisThread(message)) {
                //         if (flowDockJob.isReplyFromRequester(message)) {
                //             if (flowDockJob.jobThread.jobStatus === status.CanOverrideTAG) {
                //                 flowDockJob.objectionThread.reply("Requester Override - Starting Job");
                //                 clearTimeout(flowDockJob.objectionTimer);
                //                 flowDockJob.jobThread.reply("Override Confirmed, Starting Job, will notify the build status. You can Check the Status anytime with in this thread by replying \"status\"");
                //                 flowDockJob.startJob();
                //             } else {
                //                 flowDockJob.jobThread.reply("Job has already started.");
                //             }
                //
                //         } else {
                //             flowDockJob.jobThread.reply("[Invalid User] Override can be requested @".concat(flowDockJob.requestedBy.nick).concat(" only."))
                //         }
                //     } else {
                //         // do nothing
                //     }
                // }
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



