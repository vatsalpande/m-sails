function processRequest(req, res){
    req.options = req.options || {};

    // WantsJSON
    req.options.wantsJSON = false;

    // auto jsonp
    if (req.param('callback')){
        req.options.jsonp = true;
    }

    bindGlobal(res);
}

function getApiVersion(req){
    var accept = req.header('Accept');
    if (accept && accept.indexOf('application/vnd.m.v') == 0){
        var match = /application\/vnd\.m\.v(\d*)/.exec(accept);
        if (match && match.length == 2){
            return parseInt(match[1]);
        }
    }
    return sails.config.api.defaultVersion;
}

function bindGlobal(res){
    sails.opsins = sails.opsins || {};
    sails.opsins.currentRes = res;
}

module.exports = function (req, res, next) {

    processRequest(req, res);

    // default go next
    return next();
};
