var util = require('./util');

var sliceFontFaceSrcReferences = function (fontFaceSrc) {
    var functionParamRegexS = "\\s*(?:\"[^\"]*\"|'[^']*'|[^\\(]+)\\s*",
        referenceRegexS = "(local\\(" + functionParamRegexS + "\\))" + "|" +
                          "(url\\(" + functionParamRegexS + "\\))" + "(?:\\s+(format\\(" + functionParamRegexS + "\\)))?",
        simpleFontFaceSrcRegexS = "^\\s*(" + referenceRegexS + ")" +
                                  "(?:\\s*,\\s*(" + referenceRegexS + "))*" +
                                  "\\s*$",
        referenceRegex = new RegExp(referenceRegexS, "g"),
        repeatedMatch,
        fontFaceSrcReferences = [],
        getReferences = function (match) {
            var references = [];
            match.slice(1).forEach(function (elem) {
                if (elem) {
                    references.push(elem);
                }
            });
            return references;
        };

    if (!fontFaceSrc) {
        return [];
    }

    if (fontFaceSrc.match(new RegExp(simpleFontFaceSrcRegexS))) {
        repeatedMatch = referenceRegex.exec(fontFaceSrc);
        while (repeatedMatch) {
            fontFaceSrcReferences.push(getReferences(repeatedMatch));
            repeatedMatch = referenceRegex.exec(fontFaceSrc);
        }
        return fontFaceSrcReferences;
    }

    throw new Error("Invalid value");
};

var findFontFaceFormat = function (value) {
    var fontFaceFormatRegex = /^format\(([^\)]+)\)/,
        quotedFormat;

    if (!fontFaceFormatRegex.test(value)) {
        return null;
    }

    quotedFormat = fontFaceFormatRegex.exec(value)[1];
    return util.unquoteString(quotedFormat);
};

var extractFontFaceSrcUrl = function (reference) {
    var url, format;

    try {
        url = util.extractCssUrl(reference[0]);
        if (reference[1]) {
            format = findFontFaceFormat(reference[1]);
        }
        return {
            url: url,
            format: format
        };
    } catch (e) {}
};

exports.parse = function (fontFaceSourceValue) {
    var fontReferences = sliceFontFaceSrcReferences(fontFaceSourceValue);

    return fontReferences.map(function (reference) {
        var fontSrc = extractFontFaceSrcUrl(reference);

        if (fontSrc) {
            return fontSrc;
        } else {
            return {
                local: util.extractLocalFontName(reference)
            };
        }
    });
};

exports.serialize = function (parsedFontFaceSources) {
    return parsedFontFaceSources.map(function (sourceItem) {
        var itemValue;

        if (sourceItem.url) {
            itemValue = 'url("' + sourceItem.url + '")';
            if (sourceItem.format) {
                itemValue += ' format("' + sourceItem.format + '")';
            }
        } else {
            itemValue = sourceItem.local;
        }
        return itemValue;
    }).join(', ');
};
