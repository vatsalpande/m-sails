/**
 *  Support auto restart server when specific files change
 *
 * ---------------------------------------------------------------
 *
 */
module.exports = function(grunt) {

    grunt.config.set('nodemon', {
        dev: {
            script: 'app.js',
            options: {
                ext: 'js',
                nodeArgs: ['--debug'],
                watch: ['api', 'config', 'opsins'],
                ignore: 'api/coffee/**/*'
            }
        }
    });

    grunt.loadNpmTasks('grunt-nodemon');
};
