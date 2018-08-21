let Session = require('flowdock').Session;
let username = process.env.JenkinsUsername;
let password = process.env.JenkinsPassword;
let jenkinsAPI = require('jenkins');

// Session ID for the UserName ( Flow dock api token )
let session = new Session("f311ccca8b85108dd100309b13ff6a4a");
module.exports = {
    flowDockSession: session,
    flowIDFor: function(message){
        return message.flow
    },
    getListerOn: function(flowID){
        return session.stream(flowID)
    }
};


function init() {
    console.log("Hello World");
}

let jenkins = new jenkinsAPI({
    baseUrl: 'http://'.concat(username).concat(':').concat(password).concat('@jenkins.idfbins.com'),
    crumbIssuer: true
});







