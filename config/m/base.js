/**
 * Base config
 *
 */

module.exports = {
    mongo:{
        url: '#{mongo_url}',
        cache: {
            db: 'cache'
        }
    },
    solr : {
        host : '#{solr_host}',
        port : '#{solr_port}',
        core : 'user',
        path : '/solr',
        agent : ''
    },
};
