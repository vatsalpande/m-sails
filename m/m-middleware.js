function processRequest(req, res){
    req.options = req.options || {};

    // WantsJSON
    req.options.wantsJSON = false;

    // auto jsonp
    if (req.param('callback')){
        req.options.jsonp = true;
    }

    bindGlobal(res);
    process404(req, res);
}

function getApiVersion(req){
    var accept = req.header('Accept');
    if (accept && accept.indexOf('application/vnd.m.v') == 0){
        var match = /application\/vnd\.m\.v(\d*)/.exec(accept);
        if (match && match.length == 2){
            return parseInt(match[1]);
        }
    }
}

function bindGlobal(res){
    sails.opsins = sails.opsins || {};
    sails.opsins.currentRes = res;
}

function process404(req, res){
    sails.on('router:request:404', function(req, res){
        if(! /^\/v\d*\//.test(req.path)){
            var version = getApiVersion(req);
            if (!version || _.isNaN(version) || version < 1) {
                version = sails.config.api.defaultVersion;
            }
            var prefix = '/v' + version;
            res.redirect(prefix + req.url);
        }
    });
}

module.exports = function (req, res, next) {

    // Process API version
    // check path, if have "/v1/" style prefix
    if (/^\/v\d*\//.test(req.path)){
        // do nothing
    } else {
        var version = getApiVersion(req);
        if (version > 0){
            var prefix = '/v' + version;
            return res.redirect(prefix + req.url);
        }
    }

    processRequest(req, res);

    // default go next
    return next();
}
