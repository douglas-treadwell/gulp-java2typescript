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
        'byte'       : 'number',
        'short'      : 'number',
        'int'        : 'number',
        'integer'    : 'number', // this would be 'Integer': 'integer', but we're comparing lowercase inputs
        'long'       : 'number',
        'bigdecimal' : 'number',
        'float'      : 'number',
        'double'     : 'number',
        'boolean'    : 'boolean',
        'char'       : 'string',

        'string' : 'string', // this would be 'String': 'string', but we're comparing lowercase inputs
    };

    var arrayTypeRegex  = /(\w*Set|\w*List|\w*Queue|\w*Deque|\w*Collection)<([\w\<\>]+)>/;
    var objectTypeRegex = /(\w*Map)<(\w+),\s*(\w+)>/;
    var simpleArrayRegex = /(\w[a-zA-Z0-9]+)\[\s*\]/;

    var mappedType = typeMap[javaType.toLowerCase()];

    var arrayTypeMatch = javaType.match(arrayTypeRegex);
    var objectTypeMatch = javaType.match(objectTypeRegex);
    var simpleArrayMatch = javaType.match(simpleArrayRegex);

    if ( mappedType ) {
        return mappedType;
    } else if ( arrayTypeMatch ) {
        return typescriptType(arrayTypeMatch[2]) + '[]';
    } else if ( objectTypeMatch ) {
        return '{ [key: ' + typescriptType(objectTypeMatch[2]) + ']: ' + typescriptType(objectTypeMatch[3]) + '; }';
    } else if ( simpleArrayMatch ) {
        return typescriptType(simpleArrayMatch[1]) + '[]';
    } else {
        return javaType;
    }
}

function lowercaseLeadingLetters(string) {
    // leading uppercase letters should be lowercased, not just the first letter

    var leadingUpperCaseRegex = /[A-Z]+/;
    var leadingUpperCaseMatch = string.match(leadingUpperCaseRegex)[0];

    if ( !leadingUpperCaseMatch ) { // already has leading lowercase letters
        return string;
    }

    return leadingUpperCaseMatch.toLowerCase() + string.substring(leadingUpperCaseMatch.length);
}

function transform(javaClass) {
    currentFileErrors = [ ];

    var classNameRegex = /public (?:(?:abstract\s+)?class|interface) (\w+)/;
    var classWithSuperclassRegex = /public (?:(?:abstract\s+)?class|interface) (\w+).*?( extends (\w+(\s*,\s*\w+)*))/;
    var enumRegex = /public enum (\w+)/;
    var enumMatch;

    var classNameMatch = javaClass.match(classNameRegex);
    var className;

    if ( classNameMatch ) {
        className = classNameMatch[1];
        currentClassName = className;        
    } else if ( enumMatch = javaClass.match(enumRegex) ) {
        className = enumMatch[1];
        return 'declare type ' + ( prefixInterfaces ? 'I' + className : className) + ' = string;\n';
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

    var getterRegex = /\s*(@JsonIgnore)?\s*public (static )?([\w\<\>\[\], ]+) (?:get|is)([A-Z]\w+)/g;

    var match;

    while ( match = getterRegex.exec(javaClass) ) {
        (function() {
            var isStatic = match[2];
            var isIgnored = match[1];

            if ( isStatic || isIgnored ) {
                return;
            }

            var returnType = match[3].trim();
            var fieldForGetter = match[4];

            fieldForGetter = lowercaseLeadingLetters(fieldForGetter);

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
