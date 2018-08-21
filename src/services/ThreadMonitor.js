exports.ThreadMonitor = function newThreadMonitor(session, message){
    this.session = session;
    this.threadID = message.thread_id;
    this.flowID = message.flow;
    return this
};

exports.hasMessageOnThread = function(message){
    return this.threadID === message.thread_id;
};

exports.replyOnThread = function(description, tags, callback){
    this.session.threadMessage(this.flowID, this.threadID, description, tags, callback)
};




