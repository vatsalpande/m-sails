solr = require 'solr-client'
solrClients = {}

getSolrClient = (core)->
  if !solrClients[core]
    op = sails.config.base.solr
    if core
      op.core = core
    solrClients[core] = solr.createClient op.host, op.port
    , op.core, op.path, op.agent
  solrClients[core]

doSearch = (client, query) ->
  defer = Promise.defer()
  client.search query, (err, obj)->
    if err
      defer.reject err
    else
      defer.resolve obj

  return defer.promise

getMatchQuery = (client, criteria, isTypeAhead)->
  query = client.createQuery()
  query.set 'json.nl=map'
  query.q '*:*'
  _.forEach criteria.fq, (v)->
    if _.isArray v.query
      if isTypeAhead
        value = '(*' + v.query.join('* AND *') + '*)'
      else
        value = "(#{v.query.join ' '})"
    else
      value = v.query
    query.matchFilter v.field, value

  _.forOwn criteria, (v, k)->
    if k != 'fq' && k != '_id'
      query.matchFilter k, v

  query

getSearchQuery = (client, criteria)->
  query = client.createQuery()

  query.q criteria.query || '*:*'

  query.fl criteria.fl || '*,score'

  # field query
  if _.isArray criteria.fq
    _.forEach criteria.fq, (q)->
      if q
        query.matchFilter q.field , q.query

  # query field
  if criteria.qf
     query.qf criteria.qf

  if criteria.bq
    query.bq criteria.bq

  query.defType 'synonym_edismax'
  query.set 'synonyms=true'

  # Force the json response be the map format.
  query.set 'json.nl=map'

  if criteria.debug == 'true'
    query.set 'debug=true'

  # sort
  if criteria.sort
    # Sort when no query
    if criteria.query == '*:*'
      query.sort criteria.sort

  if _.isNumber(criteria.start) and not _.isNaN criteria.start
    query.start criteria.start
  if _.isNumber(criteria.rows) and not _.isNaN criteria.rows
    query.rows criteria.rows

  # group
  if criteria.group
    query.group criteria.group

  # Elevation
  query.set 'enableElevation=true'
  query.set 'forceElevation=true'

  # Highlight
  if criteria.qf
    query.set 'hl=on'

  return query

module.exports =
  get: (core, criteria)->
    client = getSolrClient core
    query = getMatchQuery client, criteria
    doSearch client, query

  search: (core, criteria)->
    client = getSolrClient core

    query = getSearchQuery client, criteria
    doSearch client, query

  facet: (core, field, criteria, options)->
    defer = Promise.defer()
    client = getSolrClient core
    query = getMatchQuery client, criteria
    facet =
      on: true
      field: field
      mincount: 1
    if options
      _.extend facet, options
    query.facet facet
    doSearch client, query
    .then (ret)->
      defer.resolve ret.facet_counts.facet_fields[field]

    return defer.promise

  typeAhead: (core, criteria)->
    defer = Promise.defer()
    client = getSolrClient core
    query = getMatchQuery client, criteria
    fuzzyQuery = getMatchQuery client, criteria, true

    promises = []
    promises.push doSearch client, query
    promises.push doSearch client, fuzzyQuery
    Promise.all promises
    .then (data)->
      res1 = data[0].response
      res2 = data[1].response
      res1.numFound = res2.numFound
      res2Docs = _.reject res2.docs, (doc)->
        _.some res1.docs, (d)->
          d._id == doc._id
      res1.docs = _.union res1.docs, res2Docs
      defer.resolve data[0]
    return defer.promise
