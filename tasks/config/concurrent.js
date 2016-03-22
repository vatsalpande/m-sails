/**
 *  Support run multiple blocking tasks like nodemon and watch at once
 *
 * ---------------------------------------------------------------
 *
 */
module.exports = function(grunt) {

  grunt.config.set('concurrent', {
    dev: {
      tasks: ['nodemon', 'watch', 'ts'],
      options: {
        logConcurrentOutput: true
      }
    }
  });

  grunt.loadNpmTasks('grunt-concurrent');
};
