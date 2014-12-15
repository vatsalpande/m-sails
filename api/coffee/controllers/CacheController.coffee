module.exports =
  _config: {}
  set: (req, res) ->
    state =
      ns: req.param 'ns'
      key: req.param 'key'
      value: req.param 'value'
      expire: req.param 'expire'
    ResponseHandler.respond res,
    Cache.set state.ns, state.key, state.value, state.expire

  get: (req, res) ->
    state =
      ns: req.param 'ns'
      key: req.param 'key'
    ResponseHandler.respond res, Cache.get state.ns, state.key

  remove: (req, res) ->
    state =
      ns: req.param 'ns'
      key: req.param 'key'

    ResponseHandler.respond res, Cache.remove state.ns, state.key

  removeAll: (req, res) ->
    state =
      ns: req.param 'ns'

    ResponseHandler.respond res, Cache.removeAll state.ns
