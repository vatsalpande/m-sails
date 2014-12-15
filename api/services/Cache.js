var crypto, generateKey, getDB;

crypto = require('crypto');

getDB = function() {
  return sails.config.base.mongo.cache.db;
};

generateKey = function(key) {
  var sha1;
  key = _.isString(key) ? key : '';
  sha1 = crypto.createHash('sha1');
  sha1.update(key);
  return sha1.digest('hex');
};

module.exports = {
  defaultExpire: function() {
    return sails.config.doe["default"].cacheExpires;
  },
  get: function(ns, key) {
    return MongoService.find(getDB(), ns, [
      {
        _id: generateKey(key)
      }
    ]);
  },
  set: function(ns, key, value, expire) {
    var data, date, time;
    data = {
      _id: generateKey(key),
      value: value
    };
    if (expire) {
      date = new Date;
      time = date.getTime() + expire * 1000;
      data.expireAt = new Date(time);
      MongoService.ensureIndex(getDB(), ns, {
        "expireAt": 1
      }, {
        expireAfterSeconds: 0
      });
    }
    return MongoService.save(getDB(), ns, data);
  },
  remove: function(ns, key) {
    return MongoService.remove(getDB(), ns, {
      _id: generateKey(key)
    });
  },
  removeAll: function(ns) {
    return MongoService.remove(getDB(), ns);
  }
};
