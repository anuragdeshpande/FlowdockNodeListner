let Session = require('flowdock').Session;
let FlowDockJob = require('./src/services/FlowdockJobs');
let username = process.env.JenkinsUsername;
let password = process.env.JenkinsPassword;
let jenkinsAPI = require('jenkins');

// Session ID for the UserName ( Flow dock api token )
let session = new Session("1ec2e89731ea0718a85bb5fd45bf4483");

function FlowDockService(apiKey) {
    this.session = new Session(apiKey);
    session.on('error', function (error) {
        console.log(error);
    });
    this.jobs = new Map();
    return this;
}

FlowDockService.prototype.messageInFlow = function (flowID, description, tags) {
    if (!(tags instanceof Array)) {
        tags = [tags]
    }
    this.session.message(flowID, description, tags);
    return this
};

let jenkins = new jenkinsAPI({
    baseUrl: 'http://'.concat(username).concat(':').concat(password).concat('@jenkins.idfbins.com'),
    crumbIssuer: true
});

module.exports = FlowDockService;