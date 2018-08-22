let JobTypes = require('./src/models/JobTypes');
let FlowDockJob = require('./src/services/FlowdockJobs');
let status = require('./src/models/statusCode');
let timer = require('./src/models/Constants');
let session = new Session("f311ccca8b85108dd100309b13ff6a4a");

let jenkinsFlowID = '9fd4de5f-d8e0-4907-82cd-3681252bd01e';
let serverUpdatesID = 'e72ec7b0-14c2-407e-b3b2-84a0830170ad';
let acesFlowID = '988e1f69-1883-44ee-8ffe-02aa4b16739d';
let fakeServerUpdates = 'f9e025fb-d3c5-4704-ac25-cb8226534de3';

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
            if (message.content.startsWith("@bot")) {
                message.tags.forEach(function (tag) {
                    switch (tag.toLowerCase()) {
                        case JobTypes.BuildDeploy:
                            let buildDeployJob = new FlowDockJob(JobTypes.BuildDeploy, message, session);
                            buildDeployJob.jobThreadMonitor.replyOnThread("Are you sure you want to start a Build and Deploy on the server \n Confirm by Yes/No", status.RequiresConfirmationTAG);
                            monitorThreads.set(message.thread_id, buildDeployJob);
                            // session.privateMessage(message.userId, "How are you doing today");
                            break;
                        case JobTypes.JenkinsJob:
                            console.log("Prepare Jenkins Job");
                            break;
                        case 'flowID':
                            break;
                        default:
                            let defaultJob = new FlowDockJob(JobTypes.BuildDeploy, message, session);
                            defaultJob.jobThreadMonitor.replyOnThread("No Idea what you are talking about.")
                    }
                })
            } else if (monitorThreads.has(message.thread_id)) {
                let flowDockJob = monitorThreads.get(message.thread_id);

                if (message.content.toUpperCase() === "YES") {
                    if (flowDockJob.objectionThreadMonitor !== null &&flowDockJob.objectionThreadMonitor.threadID === message.thread_id) {
                        // do nothing
                    } else if (flowDockJob.jobThreadMonitor.threadID === message.thread_id) {
                        if (flowDockJob.RequestedBy() === message.user) {
                            if (flowDockJob.jobThreadMonitor.hasPendingConfirmation) {
                                let objectionsThreadID = flowDockJob.postObjectionsInFlow(monitorThreads, fakeServerUpdates, "[Testing - Ignore] Need to start build/deploy on [Server], Reply No/Stop to stop the process. If no objections received in 15 min, build/deploy will start automatically");
                                monitorThreads.set(objectionsThreadID, flowDockJob);
                                flowDockJob.startTimerForJob(timer.JobStartTimeOut);
                                flowDockJob.jobThreadMonitor.replyOnThread("Build Deploy Confirmed, Posted in Server Updates, if no objections will start the build/deploy in 15 min. \n to immediately start the process reply \"override\"", status.CanOverrideTAG);
                            } else {
                                flowDockJob.jobThreadMonitor.replyOnThread("Thread is not waiting on confirmation.")
                            }
                        }
                    } else {
                        session.threadMessage(message.flow, message.thread_id, "[Invalid User] Only Requester can confirm")
                    }
                } else if(message.content.toUpperCase() === "NO"){
                    if (flowDockJob.objectionThreadMonitor.threadID === message.thread_id) {
                        flowDockJob.objectionThreadMonitor.replyOnThread("Cancelling build/deploy request, notifying requester.");
                        flowDockJob.jobThreadMonitor.replyOnThread("Objection Received in Server Updates group. Cancelling Build/Deploy Request.");

                        // do nothing
                    } else if (flowDockJob.jobThreadMonitor.threadID === message.thread_id) {
                        if (flowDockJob.RequestedBy() === message.user) {
                            if (flowDockJob.jobThreadMonitor.hasPendingConfirmation) {
                                let objectionsThreadID = flowDockJob.postObjectionsInFlow(fakeServerUpdates, "[Testing - Ignore] Need to start build/deploy on [Server], Reply No/Stop to stop the process. If no objections received in 15 min, build/deploy will start automatically");
                                monitorThreads.set(objectionsThreadID, flowDockJob);
                            } else {
                                flowDockJob.jobThreadMonitor.replyOnThread("Thread is not waiting on confirmation.")
                            }
                        }
                    } else {
                        session.threadMessage(message.flow, message.thread_id, "[Invalid User] Only Requester can confirm")
                    }
                } else if(message.content.toUpperCase() === "OVERRIDE"){
                    if(message.thread_id === flowDockJob.jobThreadMonitor.threadID){
                        if(message.user === flowDockJob.RequestedBy){
                            flowDockJob.objectionThreadMonitor.replyOnThread("Requester Override - Starting Job");
                            clearTimeout(flowDockJob.timer);
                            flowDockJob.jobThreadMonitor.replyOnThread("Override Confirmed, Starting Job, will notify the build status. You can Check the Status anytime with in this thread by replying \"status\"");
                            flowDockJob.startJob();
                        } else {
                            flowDockJob.jobThreadMonitor.replyOnThread("[Invalid User] Override can be requested by the original person who requested the job")
                        }
                    }else{
                        // do nothing
                    }
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



