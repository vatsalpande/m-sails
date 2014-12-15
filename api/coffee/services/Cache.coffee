crypto = require 'crypto'
getDB = -> sails.config.base.mongo.cache.db
generateKey = (key)->
  key = if _.isString key then key else ''
  sha1 = crypto.createHash 'sha1'
  sha1.update key
  sha1.digest 'hex'
module.exports =
  defaultExpire: ->
    sails.config.doe.default.cacheExpires

  get: (ns, key) ->
    MongoService.find getDB(), ns, [{_id: generateKey key}]

  set: (ns, key, value, expire) ->
    data =
      _id: generateKey(key)
      value: value
    if expire
      date = new Date
      time = date.getTime() + expire * 1000
      data.expireAt = new Date time

      # make sure expire is configured
      MongoService.ensureIndex getDB(), ns,
      { "expireAt": 1 }, { expireAfterSeconds: 0 }

    MongoService.save getDB(), ns, data

  remove: (ns, key) ->
    MongoService.remove getDB(), ns, {_id: generateKey key}

  removeAll: (ns) ->
    MongoService.remove getDB(), ns
