/**
 * Base config
 *
 */

module.exports = {
    mongo:{
        url: 'mongodb://opsins-347101.slc01.dev.ebayc3.com:27017',
        cache: {
            db: 'cache'
        }
    },
    solr : {
        host : 'slc4b01c-0f57.stratus.slc.ebay.com',
        port : '8080',
        core : 'user',
        path : '/solr',
        agent : ''
    },
};
