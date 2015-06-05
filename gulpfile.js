var gulp = require('gulp');
var jasmine = require('gulp-jasmine');

var argv = require('yargs').argv;
var flatten = require('gulp-flatten');
var gulpif = require('gulp-if');
var j2t = require('./index');

gulp.task('test', function() {
	return gulp.src('test/test.js').pipe(jasmine());
});

gulp.task('generate', function() {
	return gulp.src([argv.file || argv.files])
	    .pipe(j2t())
	    .pipe(gulpif(argv.flatten,
	    	flatten()
	    ))
		.pipe(gulp.dest(argv.outdir));
});
