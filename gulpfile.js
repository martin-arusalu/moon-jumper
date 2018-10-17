const gulp = require('gulp');
const webserver = require('gulp-webserver');
const htmlreplace = require('gulp-html-replace');
const config = require('./config.json');
const SDK_PATH = 'https://connect.facebook.net/en_US/fbinstant.6.2.js';
const BUILD_FOLDER = './build';

function make() {
  const sourceFiles = [
      'js/**/*',
      'css/**/*',
      'sound/**/*',
      'graphics/**/*',
      '!js/mock/**/*',
      '!css/mock/**/*'
  ];
  const sdkPath = SDK_PATH;

  return Promise.all([
      new Promise(function(resolve, reject){
          gulp.src(sourceFiles, { base: './' })
          .on('error', reject)
          .pipe(gulp.dest(BUILD_FOLDER))
          .on('end', resolve);
      }),
      new Promise(function(resolve, reject){
          gulp.src('./index.html')
          .on('error', reject)
          .pipe(htmlreplace({
              'js': sdkPath
          }))
          .pipe(gulp.dest(BUILD_FOLDER))
          .on('end', resolve);
      }),
  ]);
}
 
gulp.task('webserver', function() {
  gulp.src('./')
    .pipe(webserver({
      livereload: true,
      open: true,
      port: 8081
    }));
});

gulp.task('test', function() {
  make()
    .then(function() {
        gulp.src(BUILD_FOLDER)
          .pipe(webserver({
              livereload: true,
              https: true,
              port: 8081,
              open: 'https://www.facebook.com/embed/instantgames/'+config.FB_appId+'/player?game_url=https://localhost:8081'
          }));      
    })
    .catch(function(error){
        console.log('gulp:test failed', error);
    });

});