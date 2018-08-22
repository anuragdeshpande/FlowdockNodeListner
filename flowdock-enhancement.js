let Session = require('flowdock').Session;
let username = process.env.JenkinsUsername;
let password = process.env.JenkinsPassword;
let jenkinsAPI = require('jenkins');

// Session ID for the UserName ( Flow dock api token )
let session = new Session("f311ccca8b85108dd100309b13ff6a4a");
function FlowDockService(){
    this.session = null;
    this.username = null;
    return this;
}

FlowDockService.prototype.newSession = function(apiKey){
    this.session = new Session(apiKey);
    session.on('error', function(error){
        console.log(error);
    });
};

function init() {
    console.log("Hello World");
}

let jenkins = new jenkinsAPI({
    baseUrl: 'http://'.concat(username).concat(':').concat(password).concat('@jenkins.idfbins.com'),
    crumbIssuer: true
});

module.exports = FlowDockService;