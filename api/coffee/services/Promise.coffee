Promise = require 'bluebird'

## global error handler
Promise.onPossiblyUnhandledRejection (error)->
  if sails.opsins.currentRes
    errFunc = ResponseHandler.err sails.opsins.currentRes
    errFunc error
  else
    sails.log.error error

module.exports = Promise
