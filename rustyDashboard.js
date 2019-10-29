let Session = require('flowdock').Session;
let JobTypes = require('./src/models/JobTypes');
let FlowDockJob = require('./src/services/FlowdockJobs');
let JenkinsService = require('./src/services/JenkinsService');
let status = require('./src/models/statusCode');
let constants = require('./src/models/Constants');
let session = new Session("1ec2e89731ea0718a85bb5fd45bf4483");

let monitorThreads = new Map();

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

                  }
               });
            }
         }
      }
   });
});



