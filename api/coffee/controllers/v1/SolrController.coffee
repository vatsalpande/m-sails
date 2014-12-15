###
SolrController

@moduleU      :: Controller
@description :: A set of functions called `actions`

Actions contain code telling Sails how to respond to a certain type of request.
(i.e. do stuff, then send some JSON, show an HTML page,
or redirect to another URL)

You can configure the blueprint URLs which trigger these actions
(`config/controllers.js`) and/or override them with
custom routes (`config/routes.js`)

NOTE: The code you write here supports both HTTP and Socket.io automatically.

@docs        :: http://sailsjs.org/#!documentation/controllers
###

###
Overrides for the settings in `config/controllers.js`
###

getTypeAheadResults = (state)->
  qArr = state.query.split ' '
  param =
    fq: []

  # field query
  if state.fq
    if _.isArray state.fq
      param.fq = _.map state.fq, (fieldQuery)->
        fqArr = fieldQuery.split ':'
        if fqArr.length == 2
          return {
            field: fqArr[0]
            query: fqArr[1]
          }
    else
      fqArr = state.fq.split ':'
      if fqArr.length == 2
        param.fq = [{
          field: fqArr[0]
          query: fqArr[1]
        }]


  field = switch state.type
    when 'user'
      'userDisplay'
    when 'asset_name'
      'asset_name'
    when 'sa'
      'saDisplay'
    else
      state.field

  if field
    param.fq.push {
      field: field
      query: qArr
    }

  SolrService.typeAhead state.core, param

getSearchResults = (state)->
  param =
    query: state.q
    debug: state.debug
    bq: state.bq
    hl: state.hl
    group: state.group
    start: parseInt state.start
    rows: parseInt state.rows
    fl: state.fl

  # query field
  if state.qf
    param.qf = {}
    qfs = state.qf.split ','

    _.forEach qfs, (qf)->
      qfArr = qf.split ':'
      if qfArr.length == 2
        field = qfArr[0]
        factor = qfArr[1]
      else if qfArr.length == 1
        field = qfArr[0]
        factor = 1
      param.qf[field] = factor

  # field query
  if state.fq
    if _.isArray state.fq
      param.fq = _.map state.fq, (fieldQuery)->
        fqArr = fieldQuery.split ':'
        if fqArr.length == 2
          return {
            field: fqArr[0]
            query: fqArr[1]
          }
    else
      fqArr = state.fq.split ':'
      if fqArr.length == 2
        param.fq = [{
          field: fqArr[0]
          query: fqArr[1]
        }]

  # sort
  if state.sort
    sort = {}
    sortArr = state.sort.split ','
    _.forEach sortArr, (st)->
      sts = st.split ':'
      if sts.length == 2
        field = sts[0]
        direction = sts[1]
      else if sts.length == 1
        field = sts[0]
        direction = 'desc'

      if field
        sort[field] = direction
    param.sort = sort
    param.direction = state.direction

  SolrService.search state.core, param

SolrController =
  _config: {}

  get: (req, res) ->
    state = Utils.getParamState req, {core: 'user'}

    core = state.core
    delete state.id
    delete state.core

    SolrService.get core, state
    .then (ret)->
      res.json ret

  typeAhead : (req, res) ->
    state =
      type : req.param 'type', 'user'
      core : req.param 'core', 'user'
      query : req.param 'q', ''
      field : req.param 'field', ''
      fq : req.param 'fq', ''

    getTypeAheadResults(state).then (result)->
      res.json result

  search: (req, res) ->
    state = Utils.getParamState req, {
      type: 'user'
      core: 'user'
      q: '*:*'
    }

    getSearchResults(state).then (result)->
      res.json result

module.exports = SolrController
