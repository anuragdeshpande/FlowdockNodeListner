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
                message.tags.forEach(function (tag) {
                    if(!tag.toString().startsWith(":")) {
                        let flowDockJob = null;
                        console.log(tag);
                        switch (tag.toLowerCase()) {
                            case JobTypes.BuildDeploy:
                                flowDockJob = new FlowDockJob(JobTypes.BuildDeploy, message, session);
                                break;
                            case JobTypes.JenkinsJob:
                                console.log("Prepare Jenkins Job");
                                break;
                            case 'flowID':
                                break;
                            default:
                                flowDockJob = new FlowDockJob(JobTypes.BuildDeploy, message, session);
                                flowDockJob.jobThread.reply("No Idea what you are talking about.")
                        }
                        if (flowDockJob.jobStatus !== status.Ended) {
                            monitorThreads.set(message.thread_id, flowDockJob);
                        }
                    }
                });
            } else if (monitorThreads.has(message.thread_id)) {
                let flowDockJob = monitorThreads.get(message.thread_id);
                switch (flowDockJob.jobStatus) {
                    case status.Ended:
                        if(message.content !== "This Thread is no longer monitored."){
                            flowDockJob.jobThread.reply("This Thread is no longer monitored.");
                            monitorThreads.delete(message.thread_id);
                        }
                        break;
                    case status.WaitingForConfirmation:
                        flowDockJob.verifyConfirmationInMessage(message, monitorThreads);
                        break;
                    case status.WaitingObjections:
                        flowDockJob.checkForObjectionsInMessage(message);
                        break;
                    case status.JobRunning:
                        flowDockJob.checkForInterrupts(message);
                        break;
                    case status.JobSuccess:
                        flowDockJob.jobStatus = status.Ended;
                        break;
                    case status.JobFailed:
                        flowDockJob.jobStatus = status.Ended;
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



