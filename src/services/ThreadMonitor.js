let status = require('../models/statusCode');

function ThreadMonitor(session, message) {
    this.session = session;
    this.threadID = message.thread_id;
    this.flowID = message.flow;
    this.hasPendingConfirmation = false;
    this.hasPendingOverride = false;
    return this
}

ThreadMonitor.prototype.reply = function (description, tags, callback) {
    if (!(tags instanceof Array)) {
        tags = [tags]
    }
    if (tags.indexOf(status.WaitingForConfirmation) !== -1) {
        this.hasPendingConfirmation = true;
        this.jobStatus = status.Confirm;
    }
    if (tags.indexOf(status.CanOverrideTAG) !== -1) {
        this.hasPendingOverride = true;
    }
    this.session.threadMessage(this.flowID, this.threadID, description, tags, callback)
    return this
};

ThreadMonitor.prototype.isReplyOnThisThread = function(message){
    return message.thread_id === this.threadID;
};


module.exports = ThreadMonitor;






