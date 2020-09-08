var gulp = require('gulp');
var less = require('gulp-less');
var path = require('path');
var cleanCSS = require('gulp-clean-css');
var concatCss = require('gulp-concat-css');
var uglify = require('gulp-uglify');
var pump = require('pump');
var concat = require('gulp-concat');
var del = require('del');
var rename = require("gulp-rename");
var runSequence = require('run-sequence');
var sourcemaps = require('gulp-sourcemaps');
var filter = require('gulp-filter');

gulp.task('clean:static', function () {
	return del('static');
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
		'./assets/_shared/lib/jquery/jquery-2.2.4.min.js',
		'./assets/_shared/lib/bigfoot/bigfoot.min.js'])
		.pipe(gulp.dest('./static/_js/'));
});

gulp.task('watch', gulp.series('build-less', 'build-less-max', function () {
	gulp.watch('./less/**/*.less', gulp.series('build-less', 'build-less-max'));
}));

gulp.task('build',
	gulp.series('clean:static',
		'build-less-max',
		gulp.parallel('build-less', 'copy-libs')
	)
);

gulp.task('default', gulp.series('build', function (done) {
	done();
}));
