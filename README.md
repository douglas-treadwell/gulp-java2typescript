Gulp-Java2TypeScript
============================

This tool is a temporary solution (hopefully to be replaced very soon) which 
permits generating a TypeScript interface from a provided Java file.

It is a known-to-be-imperfect solution which is intended to be better than
translating Java class to TypeScript interface manually, but which because of
its known imperfections may not be able to handle all files (see below) and
may sometimes require some manual adjustment of the output file (see below).

Supported Cases
---------------
* getProperty and isBooleanProperty getters become fields of the interface
* Inheritance: "class X extends Y" becomes "interface X extends Y"
* Abstract classes
* JsonTypeInfo annotation

Unsupported Cases
-----------------
* Java files which contain multiple (including inner) classes

Cases Requiring Manual Intervention
---------------------------------
* Classes which have annotation @JsonTypeName (although this could be
    supported trivially even in this simple tool).
* Likely classes using other annotations (but @JsonTypeInfo is supported).
* Classes with getters returning collection or generic types not handled by this tool.

Example Plugin Usage
--------------------

Within a gulpfile:

	gulp.task('generate-typescript', function() {
		return gulp.src(inputFiles)
		    .pipe(j2t()) // var j2t = require('gulp-java2typescript');
	    	.pipe(gulp.dest(outputDirectory));
	});

### Options ###
* suppressConsoleErrors: Do not log errors to the console, merely emit 'recoverable error' to the pipe. (See test/test.js.)
* prefixInterfaces: Add I- prefix in front of interface names and interface file names. (Default is false.)

Example Stand-alone Usage
-------------------------

	gulp generate --files "test/input/T*.java" --outdir "test/output"

The output can also be flattened into a single directory (no subdirectories corresponding to input subdirectories).

	gulp generate --files "test/input/T*.java" --outdir "test/output" --flatten
