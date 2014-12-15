# ResponseHandler
ResponseHandler =
  err: (res)->
    (err) ->
      # Logger.error err
      sails.log.error err
      ret =
        error: err
        info: err.message

      if err.message && err.message.indexOf('alert:') == 0
        ret.message = err.message.substring 6

      res.json ret, 500

  respond: (res, promise, successFunc, errFunc)->
    successFunc ?= (ret)->
      res.json ret
    errFunc ?= ResponseHandler.err res
    promise.then successFunc
    .catch errFunc

module.exports = ResponseHandler
