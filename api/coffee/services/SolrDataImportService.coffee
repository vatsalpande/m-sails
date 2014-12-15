_ = require 'lodash'
http = require 'http'


_.extend exports,
  delta: ()->
    options = sails.config.bg.solr
    req = http.request {
      host : options.host
      port : options.port
      path : "#{options.path}/#{options.core}/dataimport?command=delta-import"
      method : 'GET'
    }, (res) ->

    req.on 'error', (e)->
      console.log "Solr Data Import Delta Request Error: #{e.message}"

    req.end()

  deleteMetric: (id) ->
    options = sails.config.bg.solr
    req = http.request {
      host : options.host
      port : options.port
      path : "#{options.path}/#{options.core}/update?stream.body=<delete><query>_id:ME_#{id}</query></delete>&commit=true"
      method : 'GET'
    }, (res) ->

    req.on 'error', (e)->
      console.log "Solr Data Import DeleteMetric Request Error: #{e.message}"

    req.end()
