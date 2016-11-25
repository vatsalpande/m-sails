var doSearch, getMatchQuery, getSearchQuery, getSolrClient, solr, solrClients;

solr = require('solr-client');

solrClients = {};

getSolrClient = function(core) {
  var op;
  if (!solrClients[core]) {
    op = sails.config.base.solr;
    if (core) {
      op.core = core;
    }
    solrClients[core] = solr.createClient(op.host, op.port, op.core, op.path, op.agent);
  }
  return solrClients[core];
};

doSearch = function(client, query) {
  var defer;
  defer = Promise.defer();
  client.search(query, function(err, obj) {
    if (err) {
      return defer.reject(err);
    } else {
      return defer.resolve(obj);
    }
  });
  return defer.promise;
};

getMatchQuery = function(client, criteria, isTypeAhead) {
  var query;
  query = client.createQuery();
  query.set('json.nl=map');
  query.q('*:*');
  _.forEach(criteria.fq, function(v) {
    var value;
    if (_.isArray(v.query)) {
      if (isTypeAhead) {
        value = '(*' + v.query.join('* AND *') + '*)';
      } else {
        value = "(" + (v.query.join(' ')) + ")";
      }
    } else {
      value = v.query;
    }
    return query.matchFilter(v.field, value);
  });
  _.forOwn(criteria, function(v, k) {
    if (k !== 'fq' && k !== '_id') {
      return query.matchFilter(k, v);
    }
  });
  return query;
};

getSearchQuery = function(client, criteria) {
  var query;
  query = client.createQuery();
  query.q(criteria.query || '*:*');
  query.fl(criteria.fl || '*,score');
  if (_.isArray(criteria.fq)) {
    _.forEach(criteria.fq, function(q) {
      if (q) {
        return query.matchFilter(q.field, q.query);
      }
    });
  }
  if (criteria.qf) {
    query.qf(criteria.qf);
  }
  if (criteria.bq) {
    query.bq(criteria.bq);
  }
  query.defType('synonym_edismax');
  query.set('synonyms=true');
  query.set('json.nl=map');
  if (criteria.debug === 'true') {
    query.set('debug=true');
  }
  if (criteria.sort) {
    if (criteria.query === '*:*') {
      query.sort(criteria.sort);
    }
  }
  if (_.isNumber(criteria.start) && !_.isNaN(criteria.start)) {
    query.start(criteria.start);
  }
  if (_.isNumber(criteria.rows) && !_.isNaN(criteria.rows)) {
    query.rows(criteria.rows);
  }
  if (criteria.group) {
    query.group(criteria.group);
  }
  query.set('enableElevation=true');
  query.set('forceElevation=true');
  if (criteria.qf) {
    query.set('hl=on');
  }
  return query;
};

module.exports = {
  get: function(core, criteria) {
    var client, query;
    client = getSolrClient(core);
    query = getMatchQuery(client, criteria);
    return doSearch(client, query);
  },
  search: function(core, criteria) {
    var client, query;
    client = getSolrClient(core);
    query = getSearchQuery(client, criteria);
    return doSearch(client, query);
  },
  facet: function(core, field, criteria, options) {
    var client, defer, facet, query;
    defer = Promise.defer();
    client = getSolrClient(core);
    query = getMatchQuery(client, criteria);
    facet = {
      on: true,
      field: field,
      mincount: 1
    };
    if (options) {
      _.extend(facet, options);
    }
    query.facet(facet);
    doSearch(client, query).then(function(ret) {
      return defer.resolve(ret.facet_counts.facet_fields[field]);
    });
    return defer.promise;
  },
  typeAhead: function(core, criteria) {
    var client, defer, fuzzyQuery, promises, query;
    defer = Promise.defer();
    client = getSolrClient(core);
    query = getMatchQuery(client, criteria);
    fuzzyQuery = getMatchQuery(client, criteria, true);
    promises = [];
    promises.push(doSearch(client, query));
    promises.push(doSearch(client, fuzzyQuery));
    Promise.all(promises).then(function(data) {
      var res1, res2, res2Docs;
      res1 = data[0].response;
      res2 = data[1].response;
      res1.numFound = res2.numFound;
      res2Docs = _.reject(res2.docs, function(doc) {
        return _.some(res1.docs, function(d) {
          return d._id === doc._id;
        });
      });
      res1.docs = _.union(res1.docs, res2Docs);
      return defer.resolve(data[0]);
    });
    return defer.promise;
  }
};
