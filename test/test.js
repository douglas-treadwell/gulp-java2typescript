var gulp = require('gulp');
var j2t = require('../index');
var fs = require('fs');

describe('java2typescript-trivial', function() {
	it('should produce an interface with fields for common public getters', function(done) {
		var stream = gulp.src('test/input/Test.java')
		    .pipe(j2t())
	    	.pipe(gulp.dest('test/output'));

	    stream.on('end', function() {
	    	var output = fs.readFileSync('test/output/Test.d.ts', { encoding: 'utf8'} );
	    	var expected = fs.readFileSync('test/expected/Test.d.ts', { encoding: 'utf8'} );

	    	expect(output).toEqual(expected);
	    	done();
	    });
	});

	it('should produce an interface that extends the interface of its superclass', function(done) {
		var stream = gulp.src('test/input/SuperTest.java')
		    .pipe(j2t())
	    	.pipe(gulp.dest('test/output'));

	    stream.on('end', function() {
	    	var output = fs.readFileSync('test/output/SuperTest.d.ts', { encoding: 'utf8'} );
	    	var expected = fs.readFileSync('test/expected/SuperTest.d.ts', { encoding: 'utf8'} );

	    	expect(output).toEqual(expected);
	    	done();
	    });
	});

	it('should emit an error when it cannot process an input file', function(done) {
		var errors = 0;

		var stream = gulp.src('test/input/ErrorTest.java')
		    .pipe(j2t({
	    			suppressConsoleErrors: true
		    	}))
		      	.on('recoverable error', function() { ++errors; })
	    	.pipe(gulp.dest('test/output'));

	    stream.on('end', function() {
	    	var output = fs.readFileSync('test/output/ErrorTest.d.ts.errors', { encoding: 'utf8'} );
	    	var expected = fs.readFileSync('test/expected/ErrorTest.d.ts.errors', { encoding: 'utf8'} );

	    	expect(errors).toEqual(1);
	    	expect(output).toEqual(expected);
	    	done();
	    });
	});

	it('should prefix interface names and file names with I- if requested', function(done) {
		var stream = gulp.src('test/input/SuperTest.java')
		    .pipe(j2t({
		    	prefixInterfaces: true
		    }))
	    	.pipe(gulp.dest('test/output'));

	    stream.on('end', function() {
	    	var output = fs.readFileSync('test/output/ISuperTest.d.ts', { encoding: 'utf8'} );
	    	var expected = fs.readFileSync('test/expected/ISuperTest.d.ts', { encoding: 'utf8'} );

	    	expect(output).toEqual(expected);
	    	done();
	    });
	});

	it('should produce an interface for an abstract class', function(done) {
		var stream = gulp.src('test/input/AbstractTest.java')
		    .pipe(j2t())
	    	.pipe(gulp.dest('test/output'));

	    stream.on('end', function() {
	    	var output = fs.readFileSync('test/output/AbstractTest.d.ts', { encoding: 'utf8'} );
	    	var expected = fs.readFileSync('test/expected/AbstractTest.d.ts', { encoding: 'utf8'} );

	    	expect(output).toEqual(expected);
	    	done();
	    });
	});

	it('should add a string field based on JsonTypeInfo', function(done) {
		var stream = gulp.src('test/input/JsonTypeInfoTest.java')
		    .pipe(j2t())
	    	.pipe(gulp.dest('test/output'));

	    stream.on('end', function() {
	    	var output = fs.readFileSync('test/output/JsonTypeInfoTest.d.ts', { encoding: 'utf8'} );
	    	var expected = fs.readFileSync('test/expected/JsonTypeInfoTest.d.ts', { encoding: 'utf8'} );

	    	expect(output).toEqual(expected);
	    	done();
	    });
	});

	it('should produce a typedef to string for enums', function(done) {
		var stream = gulp.src('test/input/EnumTest.java')
		    .pipe(j2t())
	    	.pipe(gulp.dest('test/output'));

	    stream.on('end', function() {
	    	var output = fs.readFileSync('test/output/EnumTest.d.ts', { encoding: 'utf8'} );
	    	var expected = fs.readFileSync('test/expected/EnumTest.d.ts', { encoding: 'utf8'} );

	    	expect(output).toEqual(expected);
	    	done();
	    });
	});

	it('should produce TypeScript interfaces for Java interfaces', function(done) {
		var stream = gulp.src('test/input/InterfaceTest.java')
		    .pipe(j2t())
	    	.pipe(gulp.dest('test/output'));

	    stream.on('end', function() {
	    	var output = fs.readFileSync('test/output/InterfaceTest.d.ts', { encoding: 'utf8'} );
	    	var expected = fs.readFileSync('test/expected/InterfaceTest.d.ts', { encoding: 'utf8'} );

	    	expect(output).toEqual(expected);
	    	done();
	    });
	});

	it('should not define properties for static methods', function(done) {
		var stream = gulp.src('test/input/StaticMethodTest.java')
		    .pipe(j2t())
	    	.pipe(gulp.dest('test/output'));

	    stream.on('end', function() {
	    	var output = fs.readFileSync('test/output/StaticMethodTest.d.ts', { encoding: 'utf8'} );
	    	var expected = fs.readFileSync('test/expected/StaticMethodTest.d.ts', { encoding: 'utf8'} );

	    	expect(output).toEqual(expected);
	    	done();
	    });
	});

	it('should ignore getters annotated with @JsonIgnore', function(done) {
		var stream = gulp.src('test/input/JsonIgnoreGetterTest.java')
		    .pipe(j2t())
	    	.pipe(gulp.dest('test/output'));

	    stream.on('end', function() {
	    	var output = fs.readFileSync('test/output/JsonIgnoreGetterTest.d.ts', { encoding: 'utf8'} );
	    	var expected = fs.readFileSync('test/expected/JsonIgnoreGetterTest.d.ts', { encoding: 'utf8'} );

	    	expect(output).toEqual(expected);
	    	done();
	    });
	});

	it('should handle interfaces that extend multiple other interfaces', function(done) {
		var stream = gulp.src('test/input/MultipleExtendedInterfacesTest.java')
		    .pipe(j2t())
	    	.pipe(gulp.dest('test/output'));

	    stream.on('end', function() {
	    	var output = fs.readFileSync('test/output/MultipleExtendedInterfacesTest.d.ts', { encoding: 'utf8'} );
	    	var expected = fs.readFileSync('test/expected/MultipleExtendedInterfacesTest.d.ts', { encoding: 'utf8'} );

	    	expect(output).toEqual(expected);
	    	done();
	    });
	});
});
