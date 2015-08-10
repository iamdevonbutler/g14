var gulp = require('gulp');
var babel = require("gulp-babel");
var browserify = require('gulp-browserify');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCSS = require('gulp-minify-css');
var embedlr = require('gulp-embedlr');
var watch = require('gulp-watch');
var connect = require('gulp-connect');
var clean = require('gulp-clean');
var uglify = require('gulp-uglify');
var autoprefixer = require('gulp-autoprefixer');

gulp.task('scripts', function() {
  gulp.src(['src/scripts/main.js'])
    .pipe(browserify())
    .pipe(concat('main.js'))
    .pipe(babel())
    .pipe(uglify())
    .pipe(gulp.dest('public'))
    .pipe(connect.reload());
});

gulp.task('styles', function() {
  gulp.src(['src/styles/main.scss'])
    .pipe(sass())
    .pipe(autoprefixer({
        browsers: ['last 2 versions'],
        cascade: false
    }))    
    .pipe(minifyCSS())
    .pipe(concat('main.css'))
    .pipe(gulp.dest('public'))
    .pipe(connect.reload());
});

gulp.task('html', function() {
  gulp.src("src/*.html")
    .pipe(embedlr())
    .pipe(gulp.dest('public'))
    .pipe(connect.reload());
});

gulp.task('connect', function() {
  connect.server({
    root: 'public',
    livereload: true
  });
});

gulp.task('clean', function () {
  return gulp.src('public/*', {read: false})
    .pipe(clean());
});

gulp.task('default', ['connect', 'clean', 'scripts', 'styles', 'html'], function() {

  watch('src/**', function(event) {
    gulp.run('scripts');
  });

  watch('src/styles/**', function(event) {
    gulp.run('styles');
  });

  watch('src/**/*.html', function(event) {
    gulp.run('html');
  });
});
