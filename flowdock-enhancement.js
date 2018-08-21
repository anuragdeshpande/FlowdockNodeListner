let bean = require('./src/models/Bean');
let status = require('./src/models/statusCode');
let Session = require('flowdock').Session;
let username = process.env.JenkinsUsername;
let password = process.env.JenkinsPassword;
let jenkinsAPI = require('jenkins');
let jenkins = new jenkinsAPI({
    baseUrl: 'http://'.concat(username).concat(':').concat(password).concat('@jenkins.idfbins.com'),
    crumbIssuer: true
});

// Session ID for the UserName ( Flow dock api token )
let session = new Session("f311ccca8b85108dd100309b13ff6a4a");
session.prototype.flowIDFor = function(flowID){

};

let jenkinsFlowID = '9fd4de5f-d8e0-4907-82cd-3681252bd01e';
let serverUpdatesID = 'e72ec7b0-14c2-407e-b3b2-84a0830170ad';
let acesFlowID = '988e1f69-1883-44ee-8ffe-02aa4b16739d';

let listener = session.stream([jenkinsFlowID, serverUpdatesID, acesFlowID]);
let monitorThreads = new Map();

listener.on('message', function (message) {
    if (message.event === "message") {
        session.flows(function(err, flows) {
            var anotherStream, flowIds;
            flowIds = flows.map(function(f) {
                return f.id;
            });

            console.log(flowIds.indexOf(message.flow));

        });


        if (!monitorThreads.has(message.thread_id)) {
            // check if the message is blank message
            if (message.content !== null && message.content.trim() !== "") {
                if (message.content.startsWith("@bot")) {
                    console.log(message);
                    if (message.tags.length > 0) {
                        message.tags.forEach(function (tag) {
                            switch (tag) {
                                case 'builddeploy':
                                    session.threadMessage(message.flow, message.thread_id, "Are you sure you want to start a Build and Deploy on the server \n Confirm by # Yes/No");
                                    monitorThreads.set(message.thread_id, bean.saveState(message.flow, message.thread_id, status.Confirm));
                                    // session.privateMessage(message.userId, "How are you doing today");
                                    break;
                                case 'clockmove':
                                    console.log("Get Ready for Clock move");
                                    break;
                                case 'flowID':
                                    break;
                                default:
                                    session.comment(message.flow, message.thread_id, "No Idea what you are talking about.")
                            }
                        })
                    }

                }
            }
        } else {
            // if (message.user !== '273811') {
            let messageBean = monitorThreads.get(message.thread_id);
            switch (messageBean.statusMessage) {
                case status.Confirm:
                    if (message.content.toUpperCase() === "YES") {
                        messageBean.statusMessage = status.Ready;
                        session.threadMessage(message.flow, message.thread_id, "Build Deploy Confirmed, Posted in Server Updates, if no objections will start the build/deploy in 15 min. \n to immediately start the process reply \"override\"");
                        session.message(jenkinsFlowID, "[Testing - Ignore] Need to start build/deploy on [Server], Reply No/Stop to stop the process. If no objections received in 15 min, build/deploy will start automatically", ['PostObjections'], function (err, message, res) {
                            let objectionsMessage = bean.saveState(message.flow, message.thread_id, status.WaitingObjections);
                            objectionsMessage.originalThreadID = messageBean.threadID;
                            objectionsMessage.originalFlowID = messageBean.flowID;
                            monitorThreads.set(message.thread_id, objectionsMessage);
                            messageBean.objectionsThread = message.thread_id
                        });
                        messageBean.statusMessage = status.WaitingObjections;
                    } else if (message.content.toUpperCase() === "NO") {
                        // do nothing
                    } else {
                        // session.threadMessage(message.flow, message.thread_id, "I am a toddler, please reply a binary yes or a no.")
                    }
                    break;
                case status.WaitingObjections:
                    if (message.content.toUpperCase() === "OVERRIDE") {
                        session.threadMessage(message.flow, message.thread_id, "Starting build/deploy");

                    } else if (message.content.toUpperCase() === "NO") {
                        session.threadMessage(message.flow, message.thread_id, "Cancelling build/deploy request, notifying requester.")
                        session.threadMessage(messageBean.originalFlowID, messageBean.originalThreadID, "Objection Received in Server Updates group. Cancelling Build/Deploy Request.")
                    }

            }
            // }

        }
        // if(message.content!== null && message.content.trim()!== "" && message.content.trim()=== "//bot clockmove qa"){
        //     jenkins.job.build({name: 'Clock Move Tool', parameters:{"ServerToChange": "QA"}}, function (err, data) {
        //        if(err){
        //            if(err.res.statusMessage.startsWith("Invalid password/token for user")){
        //                session.comment(jenkinsFlowID, message.id, "Failed: Invalid Password - Please check your system property");
        //            }
        //        } else {
        //            session.comment(jenkinsFlowID, message.id, "Clock Move on QA complete");
        //        }
        //        console.log(data);
        //     });
        //
        // }
    }
});

module.





