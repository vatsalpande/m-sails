var Promise;

Promise = require('bluebird');

Promise.onPossiblyUnhandledRejection(function(error) {
  var errFunc;
  if (sails.opsins.currentRes) {
    errFunc = ResponseHandler.err(sails.opsins.currentRes);
    return errFunc(error);
  } else {
    return sails.log.error(error);
  }
});

module.exports = Promise;
