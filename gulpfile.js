var gulp = require('gulp');
var less = require('gulp-less');
var path = require('path');
var cleanCSS = require('gulp-clean-css');
var concatCss = require('gulp-concat-css');
var uglify = require('gulp-uglify');
var pump = require('pump');
var concat = require('gulp-concat');

gulp.task('default', ['build'], function () {
	// place code for your default task here
});

// gulp.task('copy-libs', function() {
// 	return gulp.src('')
// })

gulp.task('build-less', function () {
	return gulp.src('./less/*.less')
		.pipe(less({
			paths: [path.join(__dirname, 'less', 'includes')]
		}))
		.pipe(gulp.dest('./build/static/css/'));
});

gulp.task('minify-css', ['build-less'], function () {
	return gulp.src('./build/static/css/*.css')
		.pipe(cleanCSS({
			compatibility: 'ie8'
		}))
		.pipe(gulp.dest('./static/static/css/'));
});

gulp.task('minify-js', ['build-js'], function (cb) {
	pump([
			gulp.src('./build/static/js/*.js'),
			uglify(),
			gulp.dest('./static/static/js/')
		],
		cb
	);
});

gulp.task('build', ['minify-css', 'minify-js'], function () {
	// return gulp.src('./build/static/css/')
	// 	.pipe(concatCss("dark_rainbow.css"))
	// 	.pipe(gulp.dest('./static/css/'));
});

gulp.task('build-js', function () {
	return gulp.src([
			'./shared_assets/lib/jquery/jquery.1.11.0.min.js',
			'./shared_assets/lib/bigfoot/bigfoot.js'
		])
		.pipe(concat('dark_rainbow.js'))
		.pipe(gulp.dest('./build/static/js/'));
});

// gulp.task('default', function () {
// 	return gulp.src('assets/**/*.css')
// 		.pipe(concatCss("styles/bundle.css"))
// 		.pipe(gulp.dest('out/'));
// });
