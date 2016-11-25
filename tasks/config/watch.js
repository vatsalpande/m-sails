/**
 * `watch`
 *
 * ---------------------------------------------------------------
 *
 * Run predefined tasks whenever watched file patterns are added, changed or deleted.
 *
 * Watch for changes on:
 * - files in the `assets` folder
 * - the `tasks/pipeline.js` file
 * and re-run the appropriate tasks.
 *
 * For usage docs see:
 *   https://github.com/gruntjs/grunt-contrib-watch
 *
 */
module.exports = function(grunt) {
  var tmpOutDir = '.tmp/ts-output/';
  grunt.config.set('watch', {
    api: {
      files: ['api/**/*.ts', '!api/**/.#*.ts'],
      tasks: ['ts', 'babel'],
      options: {
        spawn: false
      }
    },
    assets: {

      // Assets to watch:
      files: ['assets/**/*', 'tasks/pipeline.js', '!**/node_modules/**'],

      // When assets are changed:
      tasks: ['syncAssets' , 'linkAssets' ]
    }
  });

  (function onlyCompileChangedFiles(){
    var changedTsFiles = {};

    var onChangeTs = grunt.util._.debounce(function () {
      var tsFiles = Object.keys(changedTsFiles);
      var jsFiles = tsFiles.map(function(file) {
        if (file.indexOf('api/') == 0)  {
          file = file.replace(/^api\/(.+)\.ts$/, '$1.js');
        }
        return file;
      });

      tsFiles = tsFiles.concat(['typings/main.d.ts', 'api/.baseDir.ts']);
      grunt.config('ts.api.files', [{src: tsFiles, dest: tmpOutDir}]);

      grunt.config('babel.dist.files', [{
        expand: true,
        cwd: tmpOutDir,
        src: jsFiles,
        ext: '.js',
        dest: 'api'
      }]);

      changedTsFiles = Object.create(null);
    }, 50);

    grunt.event.on('watch', function (action, filepath) {
      if (filepath.endsWith('.ts')) {
        changedTsFiles[filepath] = action;
        onChangeTs();
      }
    });
  })();
  grunt.loadNpmTasks('grunt-contrib-watch');
};
