/**
 * Compile TS files to JS.
 *
 * @see https://github.com/TypeStrong/grunt-ts
 */
module.exports = function(grunt) {
  var tmpOutDir = '.tmp/ts-output/';
  grunt.config.set('ts', {
    server_commonJs: {
      files: [
        {
          src: [
            'api/**/*.ts', "!api/**/.*.ts", "!api/**/*.d.ts", "!node_modules/**/*.ts", "!typings/**/*.ts"
          ],
          dest: tmpOutDir// Will generate at the exact same location as the source.
        }
      ],

      options: {
        compiler: 'node_modules/typescript/bin/tsc',
        module: 'commonjs',
        target: 'es6',
        fast: 'never',
        comments: true,
        sourceMap: false,// Useless on the server side.
        declaration: true,// Always useful to have declarations available.
        noEmitOnError: false,// Force log errors.
        failOnTypeErrors: true,// Force log grunt errors pipeline.
        verbose: true
      }
    }
  });

  grunt.loadNpmTasks('grunt-ts');
};
