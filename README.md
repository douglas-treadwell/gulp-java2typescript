Gulp-Java2TypeScript
============================

This tool is intended to support creation and (with an appropriate workflow) 
maintenance of TypeScript interfaces that correspond to Java classes.

The goal of this tool was merely to be more efficient than translating Java
classes to TypeScript interfaces manually, which was a modest goal.  In
practice it is significantly more efficient despite its limitations.

Because this tool uses regular expressions to parse files (rather than a
context free grammar, Java reflection, or Jackson's ObjectMapper) it inherits
regular expressions' limitations.  Most of these can probably be worked around
in future versions, but with increasing complexity.  For example, parsing files
with inner classes is a natural weak area for regular expressions.  For now this
tool focuses on its natural strengths, with some exceptions.

In practice this tool can parse most files and when it cannot it is able to 
parse a large part of the file, saving time from manual translation and
improving the repeatability of translations.

I intend to provide additional tools based on other technologies for the same
purpose, but even then there should be a place for this tool.  Any text-parsing
tool (for example, a context free grammar) is limited by the lack of runtime
information (although again, with additional complexity many limitations could 
be overcome).  Runtime information would be available using Java reflection
or Jackson's ObjectMapper for example.  But the advantage
of a text-parsing tool is its independence from the original language and
tool chain.  In this case a simple plugin, which is easy to integrate into
a JavaScript build process, can accomplish a significant part of a task that
would likely require much more code and support infrastructure to accomplish
in full.  Therefore, I present this as an example of a good 80/20 solution.

Suggested Workflow
------------------

I suggest using three directories related to the generated TypeScript files.

	1. /auto: Where the output of this tool is put directly.
	2. /fixed: Fixed versions of .d.ts.error files from /auto.
	3. /manual: Fully manually created interfaces related to those in /auto.

Use this tool to generate interfaces for selected Java files, then look for any
.d.ts.error files in /auto.  Leave them there and commit all these files in Git
(or the equivalent in your VCS).  This provides a historical record of changes to
the tool's output, including to the error files.

Copy the .d.ts.error files to /fixed and manually adjust them so that they
include all the properties you need.  Of course these should also be committed.

If there are other interfaces required by the generated interfaces, but which
cannot be effectively processed by this tool, create them manually and put them
in /manual.  Of course these should also be committed.

As Java classes change, re-running this tool will update the /auto files.  If
Java files that produce .d.ts.error files are changed, the changes will need to
be manually merged into /fixed.  Classes may change such that they no longer
produce errors and no longer require a modified file in /fixed, or so that they
do.

Supported Cases
---------------
* Classes, enums, and interfaces.
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

Possible Future Support
-----------------------
* Public fields in addition to public getters
* @JsonProperty, @JsonGetter, @JsonSetter renaming of fields
* @JsonIgnore, @JsonIgnoreProperties
* @JsonTypeName in a batched file processing mode

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
