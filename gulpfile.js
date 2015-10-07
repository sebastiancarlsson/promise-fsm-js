var gulp        = require('gulp');
var gutil       = require('gulp-util');
var jshint 	    = require('gulp-jshint');
var clean	      = require('gulp-clean');
var uglify 	    = require('gulp-uglify');
var rename      = require('gulp-rename');
var replace     = require('gulp-replace');
var sequence    = require('gulp-sequence');
var insert      = require('gulp-insert');
var bump        = require('gulp-bump');
var fs          = require('fs');
var mocha       = require('gulp-mocha');
var browserSync = require('browser-sync').create();
var argv        = require('yargs').argv;

var date = new Date();
var header, packageJSON;

var lib = fs.readFileSync("./src/PromiseFSM.js", "utf8");

gulp.task('build', sequence('jshint', 'test:vanilla', 'bump', 'prepheader', 'clean', 'build:vanilla', 'build:others'));

gulp.task('bump', function() {
  var type = 'patch';
  if(argv.major === true) {
    type = 'major';
  } else if(argv.minor === true) {
    type = 'minor';
  }

  return gulp.src('./package.json')
    .pipe(bump({type:type}))
    .pipe(gulp.dest('./'));
});

gulp.task('prepheader', function() {
  packageJSON  = require('./package');
  header = fs.readFileSync("./src/partials/header", "utf8");
  header = header
    .replace("%date%", date.toUTCString())
    .replace("%name%", packageJSON.name)
    .replace("%version%", packageJSON.version);
  header += "\n";
});

gulp.task('build:vanilla', function() {
  return gulp.src(['src/PromiseFSM.js'])
    .pipe(insert.prepend(header))
    .pipe(gulp.dest('dist'))
    .pipe(uglify({
      preserveComments: 'some'
    }))
    .pipe(rename({
      suffix: ".min"
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('build:others', function() {
  return gulp.src(['src/templates/*.js'])
    .pipe(insert.prepend(header))
    .pipe(replace("%code%", lib))
    .pipe(gulp.dest('dist'))
    .pipe(uglify({
      preserveComments: 'some'
    }))
    .pipe(rename({
      suffix: ".min"
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('test:vanilla', function() {
  global.chai = require('chai');
  global.PromiseFSM = require("./include");
  global.P = require('./vendor/p');

  return gulp.src('test.js', {read: false})
    .pipe(mocha());
});

gulp.task('jshint', function() {
  return gulp.src(['src/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('jshint-examples', function() {
  return gulp.src(['examples/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('clean', function() {
  return gulp.src('dist/*')
    .pipe(clean());
});

gulp.task('serve', function () {
    browserSync.init({
      server: {
        baseDir: './'
      }
    });

    gulp.watch(['./test.js', './src/**/*.js']).on('change', browserSync.reload);
});

gulp.task('default', ['serve']);
