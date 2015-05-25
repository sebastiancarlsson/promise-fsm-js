var gulp      = require('gulp');
var gutil     = require('gulp-util');
var jshint 	  = require('gulp-jshint');
var clean	    = require('gulp-clean');
var uglify 	  = require('gulp-uglify');
var rename    = require("gulp-rename");
var replace   = require('gulp-replace');
var sequence  = require('gulp-sequence');
var insert    = require('gulp-insert');
var fs        = require('fs');
var mocha     = require('gulp-mocha');

var packageJSON  = require('./package');
var jshintConfig = packageJSON.jshintConfig;

var date = new Date();
var header = fs.readFileSync("./src/partials/header", "utf8");
header = header
  .replace("%date%", date.toUTCString())
  .replace("%name%", packageJSON.name)
  .replace("%version%", packageJSON.version);
header += "\n";

var lib = fs.readFileSync("./src/PromiseFSM.js", "utf8");

gulp.task('default', sequence('jshint', 'test', 'clean', 'build-vanilla', 'build'));

gulp.task('build-vanilla', function() {
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

gulp.task('build', function() {
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

gulp.task('test', function() {
  return gulp.src('test/test.js', {read: false})
    .pipe(mocha({reporter: 'nyan'}));
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
  gulp.src('dist/*')
    .pipe(clean());
});