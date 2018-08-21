exports.saveState = function(flowID, threadID, statusMessage){
  return new Bean(flowID, threadID, statusMessage);
};

class Bean{
    constructor(flowID, threadID, statusMessage){
        this._threadID = threadID;
        this._statusMessage = statusMessage;
        this._flowID = flowID;
        this._originalFlowID = flowID;
        this._originalThreadID = threadID;
    }


    get threadID() {
        return this._threadID;
    }

    get statusMessage() {
        return this._statusMessage;
    }

    set statusMessage(value) {
        this._statusMessage = value;
    }


    get flowID() {
        return this._flowID;
    }


    get ObjectionsThread() {
        return this._objectionsThread;
    }

    set ObjectionsThread(value) {
        this._objectionsThread = value;
    }


    get originalThreadID() {
        return this._originalThreadID;
    }

    set originalThreadID(value) {
        this._originalThreadID = value;
    }

    get originalFlowID() {
        return this._originalFlowID;
    }

    set originalFlowID(value) {
        this._originalFlowID = value;
    }
}