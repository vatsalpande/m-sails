var ObjectID, getMongo, mongo, mongoDB, mongoExecute;

mongo = require('mongodb').MongoClient;

ObjectID = require('mongodb').ObjectID;

mongoDB = {};

getMongo = function(dbname) {
  var defer, url;
  defer = Promise.defer();
  if (mongoDB[dbname]) {
    defer.resolve(mongoDB[dbname]);
  } else {
    url = sails.config.base.mongo.url + '/' + dbname;
    mongo.connect(url, function(err, db) {
      if (err) {
        return defer.reject(err);
      } else {
        mongoDB[dbname] = db;
        return defer.resolve(mongoDB[dbname]);
      }
    });
  }
  return defer.promise;
};

mongoExecute = function(dbname, collection, func, funcArgs, func2) {
  var defer, handleResponse;
  defer = Promise.defer();
  handleResponse = function(err, data) {
    if (err) {
      return defer.reject(err);
    } else {
      return defer.resolve(data);
    }
  };
  getMongo(dbname).then(function(db) {
    var col, f;
    col = db.collection(collection);
    f = col[func];
    if (func2) {
      return col[func].apply(col, funcArgs)[func2](handleResponse);
    } else {
      funcArgs.push(handleResponse);
      return col[func].apply(col, funcArgs);
    }
  });
  return defer.promise;
};

module.exports = {
  ObjectID: ObjectID,
  ensureIndex: function(db, collection, keys, options) {
    return mongoExecute(db, collection, 'ensureIndex', [keys, options]);
  },
  find: function(db, collection, params) {
    return mongoExecute(db, collection, 'find', params, 'toArray');
  },
  save: function(db, collection, param) {
    return mongoExecute(db, collection, 'save', [param]);
  },
  update: function(db, collection, criteria, data) {
    return mongoExecute(db, collection, 'update', [criteria, data, {}]);
  },
  remove: function(db, collection, param) {
    return mongoExecute(db, collection, 'remove', [param, null]);
  }
};
