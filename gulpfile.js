"use strict"

const gulp = require('gulp'),
    minifier = require('gulp-uglify/minifier'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require("uglify-js")

gulp.task("default", () =>
    gulp.src("src/CatChan.user.js")
        .pipe(sourcemaps.init())
        .pipe(minifier(
            { preserveComments: "license" },
            uglify
        ))
        .pipe(sourcemaps.write(".", {
            sourceMappingURLPrefix: `https://raw.github.com/Dogman8/CatChan/develop`
        }))
        .pipe(gulp.dest("."))
)
