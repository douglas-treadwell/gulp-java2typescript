"use strict";

var through = require("through2");
var gulp_util = require("gulp-util");
var PluginError = gulp_util.PluginError;

var currentFile;
var currentFileErrors;
var suppressConsoleErrors = false;
var prefixInterfaces = false;
var currentClassName;

function reportError(error) {
    if ( !suppressConsoleErrors ) {
        console.error('In ' + currentFile.path + ': ' + error);
    }

    currentFileErrors.push('In ' + currentFile.path + ': ' + error);
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
    currentFileErrors = [ ];

    var classNameRegex = /public (?:abstract\s+)?class (\w+)/;
    var classWithSuperclassRegex = /public (?:abstract\s+)?class (\w+).*?( extends (\w+))/;
    var classNameMatch = javaClass.match(classNameRegex);
    var className;

    if ( !classNameMatch ) {
        reportError('Unable to parse ' + javaClass);
        return '';
    } else {
        className = classNameMatch[1];
        currentClassName = className;
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
        (function() {
            var returnType = match[1].trim();
            var fieldForGetter = match[2];

            fieldForGetter = fieldForGetter[0].toLowerCase() + fieldForGetter.substring(1);

            getterTypes[fieldForGetter] = returnType;
        })();
    }

    var _interface;

    var interfaceName = className;

    if ( prefixInterfaces ) {
        interfaceName = 'I' + interfaceName;
        inheritsFrom = 'I' + inheritsFrom;
    }

    if ( inheritsFrom ) {
        _interface = 'interface ' + interfaceName + ' extends ' + inheritsFrom + ' {\n';
    } else {
        _interface = 'interface ' + interfaceName + ' {\n';
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
    suppressConsoleErrors = options && options.suppressConsoleErrors;
    prefixInterfaces = options && options.prefixInterfaces;

    return through.obj(function (file, enc, cb) {
        currentFile = file;

        var transformed = transform(file.contents.toString());
        file.contents = new Buffer(transformed);

        if ( prefixInterfaces ) {
            file = new gulp_util.File(file);
            file.path = file.base + 'I' + currentClassName + '.java';
        }

        if ( currentFileErrors.length > 0 ) {
            file.path = gulp_util.replaceExtension(file.path, '.d.ts.errors');

            for ( var i = 0; i < currentFileErrors.length; ++i ) {
                this.emit('recoverable error', new PluginError('java2typescript-trivial', currentFileErrors[i]));
            }
        } else {
            file.path = gulp_util.replaceExtension(file.path, '.d.ts');
        }
        
        this.push(file);

        cb();
    });
};
