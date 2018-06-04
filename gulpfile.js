var cleanCSS = require('gulp-clean-css');
var concat = require('gulp-concat');
var concatCss = require('gulp-concat-css');
var declarationSorter = require('css-declaration-sorter');
var del = require('del');
var filter = require('gulp-filter');
var gulp = require('gulp');
var less = require('gulp-less');
var path = require('path');
var postcss = require('gulp-postcss');
var postless = require('postcss-less');
var pump = require('pump');
var rename = require("gulp-rename");
var runSequence = require('run-sequence');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');

gulp.task('default', ['build'], function () {
	console.log('Default task complete.')
});

gulp.task('build', (callback) => {
	runSequence('clean:static', 'sort-less', 'build-less-max', ['build-less', 'copy-libs'], callback);
});

gulp.task('watch', ['build-less', 'build-less-max'], function () {
	gulp.watch(['./less/**/*.less'], ['build-less', 'build-less-max']);
});

gulp.task('clean:static', function () {
	return del.sync('static');
})

// Converts LESS files to CSS without minifying them
gulp.task('build-less-max', () => {
	return gulp.src('./less/*.less')
		.pipe(less())
		.pipe(rename({ extname: '.max.css' }))
		.pipe(gulp.dest('./static/_css/'));
});

// Converts LESS files to CSS, minifies them and creates sourcemaps
gulp.task('build-less', () => {
	const cssFilter = filter(['**/*.css'], { restore: true });

	return gulp.src('./less/*.less')
		.pipe(sourcemaps.init())
		.pipe(less())
		.pipe(
			cleanCSS({ debug: true }, (details) => {
				console.log(`${details.name} BEFORE: ${details.stats.originalSize}`);
				console.log(`${details.name} AFTER : ${details.stats.minifiedSize}`);
			}))
		.pipe(sourcemaps.write('./'))
		// Filter the minified CSS files and rename them to *.min.css
		.pipe(cssFilter)
		.pipe(rename({ extname: '.min.css' }))
		.pipe(cssFilter.restore)
		.pipe(gulp.dest('./static/_css/'));
});

// Copies lib files to output directory
gulp.task('copy-libs', (callback) => {
	return gulp.src([
		'./shared_assets/lib/jquery/jquery-2.2.4.min.js',
		'./shared_assets/lib/bigfoot/bigfoot.min.js',
		'./src/jquery.timeago.js'])
		.pipe(gulp.dest('./static/_js/'));
});

gulp.task('sort-less', function() {
	var pugins = [
		declarationSorter({ order: 'alphabetically' })
	];

	return gulp.src("./less/*.less")
	.pipe(postcss(pugins, {syntax: postless}))
	.pipe(gulp.dest('./less/'));
});
