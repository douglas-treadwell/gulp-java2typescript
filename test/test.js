var gulp = require('gulp');
var j2tt = require('../index');
var fs = require('fs');

describe('java2typescript-trivial', function() {
	it('should produce an interface with fields for common public getters', function(done) {
		var stream = gulp.src('test/input/Test.java')
		    .pipe(j2tt())
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
		    .pipe(j2tt())
	    	.pipe(gulp.dest('test/output'));

	    stream.on('end', function() {
	    	var output = fs.readFileSync('test/output/SuperTest.d.ts', { encoding: 'utf8'} );
	    	var expected = fs.readFileSync('test/expected/SuperTest.d.ts', { encoding: 'utf8'} );

	    	expect(output).toEqual(expected);
	    	done();
	    });
	});

	it('should emit errors and fall back to "any" type (where applicable) when it cannot handle a case', function(done) {
		var errors = 0;

		var stream = gulp.src('test/input/ErrorTest.java')
		    .pipe(j2tt({
	    			suppressConsoleErrors: true
		    	}))
		      	.on('recoverable error', function() { ++errors; })
	    	.pipe(gulp.dest('test/output'));

	    stream.on('end', function() {
	    	var output = fs.readFileSync('test/output/ErrorTest.d.ts.errors', { encoding: 'utf8'} );
	    	var expected = fs.readFileSync('test/expected/ErrorTest.d.ts.errors', { encoding: 'utf8'} );

	    	expect(errors).toEqual(2);
	    	expect(output).toEqual(expected);
	    	done();
	    });
	});

	it('should prefix interface names and file names with I- if requested', function(done) {
		var stream = gulp.src('test/input/SuperTest.java')
		    .pipe(j2tt({
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
		    .pipe(j2tt())
	    	.pipe(gulp.dest('test/output'));

	    stream.on('end', function() {
	    	var output = fs.readFileSync('test/output/AbstractTest.d.ts', { encoding: 'utf8'} );
	    	var expected = fs.readFileSync('test/expected/AbstractTest.d.ts', { encoding: 'utf8'} );

	    	expect(output).toEqual(expected);
	    	done();
	    });
	});
});
