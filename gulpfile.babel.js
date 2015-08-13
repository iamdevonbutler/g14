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
var gulpif = require('gulp-if');
var argv = require('yargs').argv;
var bourbon = require('node-bourbon');

function onError(err) {
  console.log(err);
  this.emit('end');
}

function isForProd() {
  return argv.prod || argv.production || argv.build;
}

gulp.task('scripts', function() {
  gulp.src(['src/scripts/main.js'])
    .pipe(browserify())
    .on('error', onError)
    .pipe(concat('main.js'))
    .pipe(babel())
    .pipe( gulpif(isForProd, uglify()) )
    .pipe(gulp.dest('public'))
    .pipe(connect.reload());
});

gulp.task('styles', function() {
  gulp.src(['src/styles/main.scss'])
    .pipe(sass({
      includePaths: bourbon.includePaths
    }))
    .on('error', onError)
    .pipe(autoprefixer({
        browsers: ['last 2 versions'],
        cascade: false
    }))
    .pipe( gulpif(isForProd, minifyCSS()) )
    .pipe(concat('main.css'))
    .pipe(gulp.dest('public'))
    .pipe(connect.reload());
});

gulp.task('html', function() {
  gulp.src("src/*.html")
    .pipe(gulpif(!isForProd(),embedlr()))
    // .pipe(embedlr())
    .pipe(gulp.dest('public'))
    .pipe(connect.reload());
});

gulp.task('assets', function() {
  gulp.src("CNAME")
    .pipe(gulp.dest('public'))
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

var tasks = !isForProd() ? ['connect', 'clean', 'scripts', 'styles', 'html'] : ['clean', 'scripts', 'styles', 'html', 'assets'];

gulp.task('default', tasks, function() {
  if (!isForProd()) {
    watch('src/**', function(event) {
      gulp.run('scripts');
    });

    watch('src/styles/**', function(event) {
      gulp.run('styles');
    });

    watch('src/**/*.html', function(event) {
      gulp.run('html');
    });
  }
});
