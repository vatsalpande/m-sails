
/*
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
 */

/*
Overrides for the settings in `config/controllers.js`
 */
var SolrController, getSearchResults, getTypeAheadResults;

getTypeAheadResults = function(state) {
  var field, fqArr, param, qArr;
  qArr = state.query.split(' ');
  param = {
    fq: []
  };
  if (state.fq) {
    if (_.isArray(state.fq)) {
      param.fq = _.map(state.fq, function(fieldQuery) {
        var fqArr;
        fqArr = fieldQuery.split(':');
        if (fqArr.length === 2) {
          return {
            field: fqArr[0],
            query: fqArr[1]
          };
        }
      });
    } else {
      fqArr = state.fq.split(':');
      if (fqArr.length === 2) {
        param.fq = [
          {
            field: fqArr[0],
            query: fqArr[1]
          }
        ];
      }
    }
  }
  field = (function() {
    switch (state.type) {
      case 'user':
        return 'userDisplay';
      case 'asset_name':
        return 'asset_name';
      case 'sa':
        return 'saDisplay';
      default:
        return state.field;
    }
  })();
  if (field) {
    param.fq.push({
      field: field,
      query: qArr
    });
  }
  return SolrService.typeAhead(state.core, param);
};

getSearchResults = function(state) {
  var fqArr, param, qfs, sort, sortArr;
  param = {
    query: state.q,
    debug: state.debug,
    bq: state.bq,
    hl: state.hl,
    group: state.group,
    start: parseInt(state.start),
    rows: parseInt(state.rows),
    fl: state.fl
  };
  if (state.qf) {
    param.qf = {};
    qfs = state.qf.split(',');
    _.forEach(qfs, function(qf) {
      var factor, field, qfArr;
      qfArr = qf.split(':');
      if (qfArr.length === 2) {
        field = qfArr[0];
        factor = qfArr[1];
      } else if (qfArr.length === 1) {
        field = qfArr[0];
        factor = 1;
      }
      return param.qf[field] = factor;
    });
  }
  if (state.fq) {
    if (_.isArray(state.fq)) {
      param.fq = _.map(state.fq, function(fieldQuery) {
        var fqArr;
        fqArr = fieldQuery.split(':');
        if (fqArr.length === 2) {
          return {
            field: fqArr[0],
            query: fqArr[1]
          };
        }
      });
    } else {
      fqArr = state.fq.split(':');
      if (fqArr.length === 2) {
        param.fq = [
          {
            field: fqArr[0],
            query: fqArr[1]
          }
        ];
      }
    }
  }
  if (state.sort) {
    sort = {};
    sortArr = state.sort.split(',');
    _.forEach(sortArr, function(st) {
      var direction, field, sts;
      sts = st.split(':');
      if (sts.length === 2) {
        field = sts[0];
        direction = sts[1];
      } else if (sts.length === 1) {
        field = sts[0];
        direction = 'desc';
      }
      if (field) {
        return sort[field] = direction;
      }
    });
    param.sort = sort;
    param.direction = state.direction;
  }
  return SolrService.search(state.core, param);
};

SolrController = {
  _config: {},
  get: function(req, res) {
    var core, state;
    state = Utils.getParamState(req, {
      core: 'user'
    });
    core = state.core;
    delete state.id;
    delete state.core;
    return SolrService.get(core, state).then(function(ret) {
      return res.json(ret);
    });
  },
  typeAhead: function(req, res) {
    var state;
    state = {
      type: req.param('type', 'user'),
      core: req.param('core', 'user'),
      query: req.param('q', ''),
      field: req.param('field', ''),
      fq: req.param('fq', '')
    };
    return getTypeAheadResults(state).then(function(result) {
      return res.json(result);
    });
  },
  search: function(req, res) {
    var state;
    state = Utils.getParamState(req, {
      type: 'user',
      core: 'user',
      q: '*:*'
    });
    return getSearchResults(state).then(function(result) {
      return res.json(result);
    });
  }
};

module.exports = SolrController;
