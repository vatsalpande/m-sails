module.exports = function (sails) {

    return {
        // Runs automatically when the hook initializes
        initialize: function (cb) {

            // You must trigger `cb` so sails can continue loading.
            // If you pass in an error, sails will fail to load, and display your error on the console.
            sails.on('router:after', bindVersionRouter);

            return cb();
        }
    };
};

function bindVersionizeAPI(version){
    _.forOwn(sails.controllers, function(ctl, key){
        if (key.indexOf(version) == 0){
            var prefix = key.substring(version.length);
            _.forOwn(ctl, function(method, k){
                if(_.isFunction(method)){
                    sails.router.bind(prefix + '/' + k, method);
                }
            });
        }
    });
}

function bindVersionRouter(){
    var version = sails.config.api.defaultVersion;
    if (version > 0){
        bindVersionizeAPI("v" + version);
    }
}
