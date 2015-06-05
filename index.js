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
        return typescriptType(arrayTypeMatch[2]) + '[]';
    } else if ( objectTypeMatch ) {
        return '{ [key: ' + typescriptType(objectTypeMatch[2]) + ']: ' + typescriptType(objectTypeMatch[3]) + '; }';
    } else {
        return javaType;
    }
}

function transform(javaClass) {
    currentFileErrors = [ ];

    var classNameRegex = /public (?:(?:abstract\s+)?class|interface) (\w+)/;
    var classWithSuperclassRegex = /public (?:(?:abstract\s+)?class|interface) (\w+).*?( extends (\w+))/;
    var enumRegex = /public enum (\w+)/;
    var enumMatch;

    var classNameMatch = javaClass.match(classNameRegex);
    var className;

    if ( classNameMatch ) {
        className = classNameMatch[1];
        currentClassName = className;        
    } else if ( enumMatch = javaClass.match(enumRegex) ) {
        className = enumMatch[1];
        return 'type ' + ( prefixInterfaces ? 'I' + className : className) + ' = string;\n';
    } else {
        reportError('Unable to parse ' + javaClass);
        return '';
    }

    var inheritanceMatch = javaClass.match(classWithSuperclassRegex);
    var inheritsFrom;

    if ( inheritanceMatch ) {
        inheritsFrom = inheritanceMatch[3];
    }

    var fieldTypes = { };

    var jsonTypeInfoRegex = /@JsonTypeInfo\(\s+use = JsonTypeInfo.Id.NAME,\s+include = JsonTypeInfo.As.PROPERTY,\s+property = "(\w+)"\s*\)/;

    var jsonTypeInfoMatch = javaClass.match(jsonTypeInfoRegex);

    if ( jsonTypeInfoMatch ) {
        fieldTypes[ jsonTypeInfoMatch[1] ] = 'string';
    }

    var getterRegex = /public ([\w\<\>\[\], ]+) (?:get|is)([A-Z]\w+)/g;

    var match;

    while ( match = getterRegex.exec(javaClass) ) {
        (function() {
            var returnType = match[1].trim();
            var fieldForGetter = match[2];

            fieldForGetter = fieldForGetter[0].toLowerCase() + fieldForGetter.substring(1);

            fieldTypes[fieldForGetter] = returnType;
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

    for ( var field in fieldTypes ) {
        if ( fieldTypes.hasOwnProperty(field) ) {
            _interface += '\t' + field + ': ' + typescriptType(fieldTypes[field]) + ';\n'
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
