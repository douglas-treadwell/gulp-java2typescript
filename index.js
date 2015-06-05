"use strict";

var through = require("through2");
var gulp_util = require("gulp-util");

var currentFile;
var fileHasErrors = { };

function reportError(error) {
    console.error('In ' + currentFile.path + ': ' + error);
    fileHasErrors[currentFile.path] = true;
}

function typescriptType(javaType) {
    var typeMap = {
        'byte'   : 'number',
        'short'  : 'number',
        'int'    : 'number',
        'integer': 'number', // this would be 'Integer': 'integer', but we're comparing lowercase inputs
        'long'   : 'number',
        'float'  : 'number',
        'double' : 'number',
        'boolean': 'boolean',
        'char'   : 'string',

        'string' : 'string', // this would be 'String': 'string', but we're comparing lowercase inputs
    };

    var arrayTypeRegex  = /(\w*Set|\w*List|\w*Queue|\w*Deque|\w*Collection)<(\w+)>/;
    var objectTypeRegex = /(\w*Map)<(\w+),\s*(\w+)>/;

    var mappedType = typeMap[javaType.toLowerCase()];

    var arrayTypeMatch = javaType.match(arrayTypeRegex);
    var objectTypeMatch = javaType.match(objectTypeRegex);

    if ( mappedType ) {
        return mappedType;
    } else if ( arrayTypeMatch ) {
        return arrayTypeMatch[2] + '[]';
    } else if ( objectTypeMatch ) {
        return '{ [key: ' + objectTypeMatch[2] + ']: ' + objectTypeMatch[3] + '; }';
    } else if ( javaType.indexOf('[') === -1 && javaType.indexOf('<') === -1 ) {
        return javaType; // returning another DTO
    } else {
        reportError('Unable to handle Java type ' + javaType);
        return 'any';
    }
}

function transform(javaClass) {
    var classNameRegex = /public class (\w+)/;
    var classWithSuperclassRegex = /public class (\w+).*?( extends (\w+))/;
    var classNameMatch = javaClass.match(classNameRegex);
    var className;

    if ( !classNameMatch ) {
        console.error('Unable to parse ' + javaClass + ' in ' + currentFile.path);
        return;
    } else {
        className = classNameMatch[1];
    }

    var inheritanceMatch = javaClass.match(classWithSuperclassRegex);
    var inheritsFrom;

    if ( inheritanceMatch ) {
        inheritsFrom = inheritanceMatch[3];
    }

    var getterRegex = /public ([\w\<\>\[\], ]+) get(\w+)/g;

    var getterTypes = { };

    var match;

    while ( match = getterRegex.exec(javaClass) ) {
        getterTypes[match[2]] = match[1].trim();
    }

    var _interface;

    if ( inheritsFrom ) {
        _interface = 'interface ' + className + ' extends ' + inheritsFrom + ' {\n';
    } else {
        _interface = 'interface ' + className + ' {\n';
    }

    for ( var getter in getterTypes ) {
        if ( getterTypes.hasOwnProperty(getter) ) {
            _interface += '\t' + getter + ': ' + typescriptType(getterTypes[getter]) + ';\n'
        }
    }

    _interface += '}\n';

    return _interface;
}

module.exports = function (options) {
  return through.obj(function (file, enc, cb) {
    currentFile = file;

    var transformed = transform(file.contents.toString());
    file.contents = new Buffer(transformed);

    if ( fileHasErrors[currentFile.path] ) {
        file.path = gulp_util.replaceExtension(file.path, '.d.ts.errors');
    } else {
        file.path = gulp_util.replaceExtension(file.path, '.d.ts');
    }
    this.push(file);

    cb();
  });
};