mysql = require('mysql')

pools = {}

getConnection= (options)->
  options ?= sails.config.doe.mysql
  mysql.createConnection {
      host     : options.host
      port     : if options.port then options.port else 3306
      user     : options.user
      password : options.password
      dateStrings: true
    }

###
  connect(options, callback)
  or connect(callback)
###
connect= ()->     # callBack(err, conn)
  if _.isFunction arguments[0]
    callBack = arguments[0]
  else if _.isObject(arguments[0]) and _.isFunction arguments[1]
    options = arguments[0]
    callBack = arguments[1]
  if not callBack
    throw new Error 'Parameter type wrong for MysqlService.connect'

  options ?= sails.config.doe.mysql
  if not pools[options.key]?
    pools[options.key] = mysql.createPool {
        host     : options.host
        port     : if options.port then options.port else 3306
        user     : options.user
        password : options.password
        dateStrings: true
      }
  pools[options.key].getConnection callBack

transaction= (callBack)->    # callBack(err, conn)
  connect (err, conn)->
    if err
      return callBack err, null
    conn.beginTransaction (transErr)->
      if transErr
        conn.release()
        return callBack transErr, null
      return callBack null, conn



###
  conf = {
    'a': {
      depend : ['b', 'c'] | []
      query: 'select' | (x) -> x + 1 | null
    }
  }
###
graph= (conf, options, cache, isTransaction=false) ->
  options ?= sails.config.doe.mysql
  dataset = {}
  allDefer = Promise.defer()

  buildDependency = (key, conn) ->
    confBody = conf[key]
    dependPromise = Promise.all (conf[i].defer.promise for i in confBody.depend)
    dependPromise.then (r)->
      try
        sql = if _.isFunction confBody.query then confBody.query dataset else confBody.query
      catch e
        dataset[key] = e
        confBody.defer.reject e
        return
      if sql?
        if cache
          queryWithCache cache.collection, options, sql, {}, cache.expire
          .then (queryData)->
            dataset[key] = queryData
            confBody.defer.resolve queryData
        else
          query options, sql, {}
          .then (queryData)->
            dataset[key] = queryData
            confBody.defer.resolve queryData
      else
        dataset[key] = null
        confBody.defer.resolve null

  # initialize, check config
  for id, cf of conf
    cf.defer = Promise.defer()
    cf.depend = [] if not cf.depend?
    for dep in cf.depend
      if not dep of conf
        confErr = new Error "graph id '#{dep}' not found"
        console.log confErr.toString()
        allDefer.reject confErr
        return allDefer

  # start
  connFunc = if isTransaction then transaction else connect
  connFunc (connErr, myConn)->
    if connErr
      return allDefer.reject connErr

    # build graph dependency
    for id, cf of conf
      buildDependency id, myConn

    # graph done
    allPromise = Promise.all (cf.defer.promise for id, cf of conf)
    allPromise.then (r)->
      if isTransaction
        myConn.commit (commitErr)->
          myConn.release()
          if commitErr
            return allDefer.reject commitErr
          allDefer.resolve dataset
      else
        myConn.release()
        allDefer.resolve dataset
    , (r)->
      if isTransaction
        myConn.rollback (rollBackErr)->
          myConn.release()
          if rollBackErr
            return allDefer.reject rollBackErr
          allDefer.reject r
      else
        myConn.release()
        allDefer.reject r

  return allDefer.promise

###
  query with sql
###
query = (options, sql, data)->
  defer = Promise.defer()
  connect options, (err, conn)->
    if err
      defer.reject err
    else
      data ?= {}
      conn.query sql, data, (err, data)->
        if err
          defer.reject err
        else
          defer.resolve data
        conn.release()
  defer.promise

###
  query with sql, and cache data
  params
###
queryWithCache = (cacheCollection, options, sql, param, expire) ->
  defer = Promise.defer()
  Cache.get cacheCollection, sql
  .then (ret)->
    if ret.length > 0
      defer.resolve ret[0].value
    else
      query(options, sql, param).then (data)->
        Cache.set cacheCollection, sql, data, expire
        defer.resolve data
  defer.promise

###
  sanitize sql to prevent sql injection
###
sanitize = (s)->
  s.replace(/-{2,}/, '-')
    .replace(/[*/]+/, '')
    .replace /(;|\s)(exec|execute|select|insert|update|delete|create|alter|drop|rename|truncate|backup|restore)\s/i, ''

# exports
module.exports = {
  sanitize : sanitize
  format : mysql.format
  getConnection : getConnection
  connect       : connect
  transaction   : transaction
  graph         : graph
  query         : query
  queryWithCache: queryWithCache
}
