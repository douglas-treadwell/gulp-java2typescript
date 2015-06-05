Java2TypeScript-Trivial
============================

This tool is a temporary solution (hopefully to be replaced very soon) which 
permits generating a TypeScript interface from a provided Java file.

It is a known-to-be-imperfect solution which is intended to be better than
translating Java class to TypeScript interface manually, but which because of
its known imperfections may not be able to handle all files (see below) and
may sometimes require some manual adjustment of the output file (see below).

Unsupported Cases
-----------------
* Java files which contain multiple (including inner) classes

Cases Requiring Manual Intervention
---------------------------------
* Classes which have annotation @JsonTypeInfo or inherit from a superclass
  with that annotation.
  - A separate interface file can be created, or the original output modified,
    to include the type property parameter. (TypeScript merges interface
    definitions when they do not conflict.)
* Classes which have annotation @JsonTypeName (although this could be
    supported trivially even in this simple tool).
* Likely classes using other annotations.
* Classes with getters returning collection types not detected by this tool.

Example Usage
-------------

Within a gulpfile:

	gulp.task('generate-typescript', function() {
		return gulp.src(inputFiles)
		    .pipe(j2tt()) // var j2tt = require('java2typescript-trivial');
	    	.pipe(gulp.dest(outputDirectory));
	});

Stand-alone usage:

	gulp generate --files "test/input/T*.java" --outdir "test/output"

The output can also be flattened into a single directory (no subdirectories corresponding to input subdirectories).

	gulp generate --files "test/input/T*.java" --outdir "test/output" --flatten

### Options ###
* suppressConsoleErrors: Do not log errors to the console, merely emit 'recoverable error' to the pipe. (See test/test.js.)
* prefixInterfaces: Add I- prefix in front of interface names and interface file names. (Default is false.)