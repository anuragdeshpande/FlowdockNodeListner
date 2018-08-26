exports.JobStartTimeOut = 10000;
exports.StatusCheckTimeout = 10000;
exports.ConfirmationRequestMessage = "Are you sure you want to start a Build and Deploy on the server \n Confirm by `Yes` or `No`";
exports.ConfirmationAckMessage = "Build Deploy Confirmed, Posted in Server Updates, if no objections will start the build/deploy in 15 min. \n to immediately start the process reply `override`";
exports.YesNoUserMessage = "Please reply in `Yes` or `No`";
exports.ObjectionsMessage = "Need to start build/deploy on [Server], Reply `No` or `Stop` to stop the process. If no objections received in ***15 min***, build/deploy will start automatically";
exports.NonConversationalMessage = "I am Looking forward to speak to you as well, It is sweet of you to consider me human and wanted to have a conversation, but I am still young and learning.";
exports.UnknownServer = "Unknown Server";
exports.ComingSoon = "Setting up custom data values coming soon. Please support this project.";
exports.CurrentLogsServers = "Currently you can get logs for `cc8dev`, `cc8uat` and `cc8buat`";
exports.InvalidNameTerminate = "No Valid Server Name found to get Logs. Request Terminated.";
exports.ReadingLogs = "Reading Logs...";
exports.RequestTermninated = "Request Terminated.";
exports.Redirecting = "Redirecting....";
exports.Checking = "Checking....";
exports.WhatCanYouDo = "Howdy, I Can \n 1. `builddeploy` servers - use @Bot #builddeploy `servername`"
    .concat("\n 2. `logs` Get you last 150 lines of logs for servers - use @Bot #logs `servername`")
    .concat("\n 3. `docs` Get you GW Docs - use @Bot #docs `cc` or `pc` or `bc` or `portals`")
    .concat("\n I am learning Everyday.");




// Server Constants
exports.CC8DEV = "cc8dev";
exports.CC8UAT = "cc8uat";
exports.CC8BUAT = "cc8buat";
exports.CC = "cc";
exports.PC = "pc";
exports.BC = "bc";
exports.Portals = "portal";

// Flow IDs
exports.fakeServerUpdates = 'f9e025fb-d3c5-4704-ac25-cb8226534de3';
exports.jenkinsFlowID = '9fd4de5f-d8e0-4907-82cd-3681252bd01e';
exports.serverUpdatesID = 'e72ec7b0-14c2-407e-b3b2-84a0830170ad';
exports.acesFlowID = '988e1f69-1883-44ee-8ffe-02aa4b16739d';


// File System Paths
exports.CC8DEVLogPath = "//FBMSGWCC-dev81/d-tmp//gwlogs/ClaimCenter/logs/cclog.log";
exports.CC8UATLogPath = "//FBMSGWCC-uat81/d-tmp/gwlogs/ClaimCenter/logs/cclog.log";
exports.CC8BUATLogPath = "//FBMSGWCCb-uat81/d-tmp/gwlogs/ClaimCenter/logs/cclog.log";


// URLs
exports.CCDocs = "http://fbmsgw-bld81.idfbins.com/docs/CC805/wwhelp/wwhimpl/js/html/wwhelp.htm#href=Welcome%20to%20ClaimCenter/cover.html";
exports.PCDocs = "http://fbmsgw-bld81.idfbins.com/docs/PC806/wwhelp/wwhimpl/js/html/wwhelp.htm#href=Welcome%20to%20PolicyCenter/cover.html";
exports.BCDocs = "http://fbmsgw-bld81.idfbins.com/docs/BC805/wwhelp/wwhimpl/js/html/wwhelp.htm#href=Welcome%20to%20BillingCenter/cover.html";
exports.PortalDocs = "http://fbmsgw-bld81.idfbins.com/docs/CP500/wwhelp/wwhimpl/js/html/wwhelp.htm#href=Welcome%20to%20Claim%20Portal/cover.html";
