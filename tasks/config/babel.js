/**
 * Compile es6 files to es5.
 *
 */
module.exports = function(grunt) {
  grunt.config.set('babel', {
    options: {
      sourceMap: true,
      presets: ['babel-preset-es2015-loose']
    },
    dist: {
      files: [{
        expand: true,
        cwd: '.tmp/ts-output',
        src: ['**/*.js'],
        ext: '.js',
        dest: 'api'
      }]
    }
  });

  grunt.loadNpmTasks('grunt-babel');
};
