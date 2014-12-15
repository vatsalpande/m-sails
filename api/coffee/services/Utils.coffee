_ = require('lodash')

module.exports =
  # dateFormat(new Date(), 'yyyy-MM-dd hh:mm:ss')
  dateFormat : (dt, fmt) ->
    o = {
      "M+": dt.getMonth() + 1
      "d+": dt.getDate()
      "h+": dt.getHours()
      "m+": dt.getMinutes()
      "s+": dt.getSeconds()
      "q+": Math.floor((dt.getMonth() + 3) / 3)
      "S": dt.getMilliseconds()
    }
    if /(y+)/.test(fmt)
      fmt = fmt.replace(RegExp.$1, (dt.getFullYear() + "").substr(4 - RegExp.$1.length))
    for k of o
      if new RegExp("(" + k + ")").test(fmt)
        fmt = fmt.replace(RegExp.$1, if (RegExp.$1.length == 1) then (o[k]) else (("00" + o[k]).substr(("" + o[k]).length)))
    return fmt


  ###
    this function help to check the restriction for input or output data, set default value or force overwrite it
    note: keys not exists in rules will removed from data, it's a white list

    example    # operation priority is ascending, when they exits in one key
    -------
      rule:
        id:
          required: true          # when required is true, "id" must be provided
        name:
          defaultsTo: 'my name'   # if name is not defined, it will use 'my name' as default value
                                  # function(without parameters) are supported
        upd_date:
          setTo: '2013-02-01'     # cre_date will be set to '2013-02-01', whether it's undefined or not
                                  # function(without parameters) are supported
        cre_date:
          transform: (v) -> new Date v
                                  # need a lambda function here, with a parameter for origial value

  ###
  dataRefine : (data, rule) ->
    refinedData = {}
    for key, conf of rule
      if data[key] isnt undefined
        refinedData[key] = data[key]
      if conf.required and data[key] is undefined
        return [data, new Error("Key '#{key}' is undefined")]
      if conf.defaultsTo isnt undefined and data[key] is undefined
        if conf.defaultsTo instanceof Function
          try
            refinedData[key] = conf.defaultsTo()
          catch e
            return [data, e]
        else
          refinedData[key] = conf.defaultsTo
      if conf.setTo isnt undefined
        if conf.setTo instanceof Function
          try
            refinedData[key] = conf.setTo()
          catch e
            return [data, e]
        else
          refinedData[key] = conf.setTo
      if refinedData[key] isnt undefined and conf.transform instanceof Function
        try
          refinedData[key] = conf.transform refinedData[key]
        catch e
          return [data, e]
    return [refinedData, null]


  # throws error
  outerCrossJoin: (data1, data2, keys1, keys2) ->
    arrToMapNull = (arr) ->
      mapNull = {}
      for a in arr
        mapNull[a] = null
      return mapNull

    if (_.intersection keys1, keys2).length > 0
      throw new Error("outerCrossJoin keys duplicated")
    results = []
    if data1.length is 0 and data2.length isnt 0
      data1 = [ arrToMapNull(keys1) ]
    if data2.length is 0 and data1.length isnt 0
      data2 = [ arrToMapNull(keys2) ]

    for d1 in data1
      for d2 in data2
        joint = {}
        for k1 in keys1
          joint[k1] = if d1[k1] is undefined then throw new Error("key '#{k1}' is undefined in outerCrossJoin") else d1[k1]
        for k2 in keys2
          joint[k2] = if d2[k2] is undefined then throw new Error("key '#{k2}' is undefined in outerCrossJoin") else d2[k2]
        results.push(joint)
    return results


  relativeSort : ( results, key ,ids) ->
    map = {}
    for i in [ids.length-1..0]
      map[ids[i]] = i
    results.sort (a,b) -> map[a[key]] - map[b[key]]
    return results


  mapGroup : (arr, key, values ) ->
    map = {}
    for i in arr
      k = i[key]
      if not map[k]? then map[k] = []
      tmp = {}
      for v in values
        tmp[v] = i[v]
      map[k].push(tmp)
    return map


  # throws error
  select : (data, attrs) ->
    results = []
    for rec in data
      cpRec = {}
      for col in attrs
        if not col of rec
          throw new Error("attribute '#{col}' is undefined in function Utils.select")
        cpRec[col] = rec[col]
      results.push(cpRec)
    return results

  getParam: (req, param, defaultVal = '') ->
    ret = req.param param
    if !ret
      ret = defaultVal
    return rte

  getParamState: (req, defaultData)->
    state = _.clone req.allParams()

    # if no value then use default data
    state = _.assign state, defaultData, (oldV, newV)->
      if not oldV
        newV
      else
        oldV

    # add group support for parameters
    # if there is {"a": "true", "a.b":"test"},
    # we made it to {"a":{"on":true, "b":"test"}}
    _.forOwn state, (v, k)->
      arr = k.split '.'
      if arr.length == 2 and arr[1] and  _.has state, arr[0]
        if not state[arr[0]].on?
          if state[arr[0]] == 'true'
            state[arr[0]] =
              on: true
          else
            state[arr[0]] =
              on: false
        if state[arr[0]].on
          state[arr[0]][arr[1]] = v
          delete state[k]

  getWithCache: (cacheCollection, key, func, expire) ->
    defer = Promise.defer()
    Cache.get cacheCollection, key
    .then (ret)->
      if ret.length > 0
        defer.resolve ret[0].value
      else
        func().then (data)->
          Cache.set cacheCollection, key, data, expire
          defer.resolve data
    defer.promise
