mongo = require('mongodb').MongoClient
ObjectID = require('mongodb').ObjectID
mongoDB = {}

getMongo = (dbname)->
  defer = Promise.defer()
  if mongoDB[dbname]
    defer.resolve mongoDB[dbname]
  else
    url = sails.config.base.mongo.url + '/' + dbname
    mongo.connect url, (err, db) ->
      if err
        defer.reject err
      else
        mongoDB[dbname] = db
        defer.resolve mongoDB[dbname]
  return defer.promise

mongoExecute = (dbname, collection, func, funcArgs, func2)->
  defer = Promise.defer()
  handleResponse = (err, data) ->
    if err
      defer.reject err
    else
      defer.resolve data
  getMongo(dbname).then (db) ->
    col = db.collection collection
    f = col[func]
    if func2
      col[func].apply(col, funcArgs)[func2] handleResponse
    else
      funcArgs.push handleResponse
      col[func].apply col, funcArgs

  return defer.promise

# exports
module.exports =
  ObjectID: ObjectID

  ensureIndex: (db, collection, keys, options) ->
    mongoExecute db, collection, 'ensureIndex', [keys, options]

  find: (db, collection, params) ->
    mongoExecute db, collection, 'find', params, 'toArray'

  save: (db, collection, param) ->
    mongoExecute db, collection, 'save', [param]

  update: (db, collection, criteria, data) ->
    mongoExecute db, collection, 'update', [criteria, data, {}]

  remove: (db, collection, param) ->
    mongoExecute db, collection, 'remove', [param, null]
