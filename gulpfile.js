const gulp = require('gulp');
const babel = require('gulp-babel');

gulp.task('javascript', function() {
    return gulp.src('src/**/*.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest('lib'));
});

gulp.task('jsx', function() {
    return gulp.src('src/**/*.jsx')
        .pipe(babel({
            presets: ['react']
        }))
        .pipe(gulp.dest('lib'));
});

gulp.task('watch', ['javascript','jsx'], function() {

  gulp.watch('src/**/*', ['javascript','jsx']);
});
