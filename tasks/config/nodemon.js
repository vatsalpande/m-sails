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
        watch: ['api', 'config', 'm'],
        // omit this property if you aren't serving HTML files and
        // don't want to open a browser tab on start
        callback: function (nodemon) {
          nodemon.on('log', function (event) {
            console.log(event.colour);
          });

          // opens browser on initial server start
          nodemon.on('config:update', function () {
            // Delay before server listens on port
            setTimeout(function() {
              require('open')('http://localhost:1337');
            }, 2000);
          });
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-nodemon');
};
