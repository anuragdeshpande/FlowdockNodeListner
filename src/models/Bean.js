exports.Bean = function (message, statusMessage) {
    this._threadID = message.thread_id;
    this._statusMessage = statusMessage;
    this._flowID = message.flow;
    this._originalFlowID = message.flow;
    this._originalThreadID = message.thread_id;
    this.timer = null;
    this.requestedBy = message.user;
    return this
};

exports.Bean.prototype.saveState = function (flowID, threadID, statusMessage) {
    return new Bean(flowID, threadID, statusMessage);
};

exports.startJob = function (jobName) {
    this.timer = setTimeout(function(){
        console.log("I am Here");
    }, 25000);
    return this;
};

exports.Bean.prototype.RequestedBy = function(){
  return this.requestedBy;
};

exports.Bean.prototype.OriginalFlowID = function () {
    return this._originalFlowID;
};

exports.Bean.prototype.FlowID = function () {
    return this._flowID;
};

exports.Bean.prototype.OriginalThreadID = function () {
    return this._originalThreadID;
};

exports.Bean.prototype.ThreadID = function () {
    return this._threadID;
};

exports.Bean.prototype.getTimer = function () {
    return this.timer;
};