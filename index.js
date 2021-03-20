(function() {
    "use strict";
    const typeOf = require('remedial').typeOf;
    const trimWhitespace = require('remove-trailing-spaces');
    const YAML = require('js-yaml')
    const stringify = data => {
        let indentLevel = ''
        const handlers = {
            "undefined": () => 'null',
            // objects will not have `undefined` converted to `null`
            // as this may have unintended consequences
            // For arrays, however, this behavior seems appropriate
            "null": () => 'null',
            "number": value => value,
            "boolean": value => value ? 'true' : 'false',
            "string": value => {
                try {
                    if (YAML.load(value) === value) {
                        return value
                    }
                } catch (e) {}
                let str = YAML.dump(value)
                if (str.match(/^>\s*\n/)) {
                    str = '|' + str.slice(1).replaceAll('\n\n', '\n')
                }
                if (str[0] === '|') {
                    str = str.replaceAll(/(?<=\n)^/mg, indentLevel)
                }
                return str
            },
            "array": value => {
                if (0 === value.length) {
                    return '[]'
                }
                let output = ''
                indentLevel = indentLevel.replace(/$/, '  ')

                let short = true
                value.forEach(value => {
                    const type = typeOf(value)
                    if (type === 'array' || type === 'object') {
                        short = false
                    } else if (type === 'string' && value.match(/\$/)) {
                        short = false
                    }
                })

                value.forEach((y, i) => {
                    if (short) {
                        output += (i > 0 ? ', ' : '[ ') + handle(y)
                    } else {
                        output += '\n' + indentLevel + '- ' + handle(y, true)
                    }
                })

                if (short) {
                    output += ' ]'
                }

                indentLevel = indentLevel.replace(/  /, '')

                return output
            },
            "object": (value, inArray, rootNode) => {

                var output = ''

                if (0 === Object.keys(value).length) {
                    output += '{}'
                    return output;
                }

                if (!rootNode) {
                    indentLevel += '  '
                }

                Object.keys(value).forEach((k, i) => {
                    const val = value[k]

                    if ('undefined' === typeof val) {
                        // the user should do
                        // delete obj.key
                        // and not
                        // obj.key = undefined
                        // but we'll error on the side of caution
                        return
                    }

                    if (!(inArray && i === 0)) {
                        output += '\n' + indentLevel
                    }

                    if (val === null) {
                        output += k + ':'
                    } else {
                        output += k + ': ' + handle(val)
                    }
                });
                indentLevel = indentLevel.replace(/  /, '')

                return output;
            },
            "function": function () {
                // TODO this should throw or otherwise be ignored
                return '[object Function]';
            }
        }

        const handle = (value, inArray, parentNode) => {
            const type = typeOf(value)
            return handlers[type](value, inArray, parentNode)
        }

        return trimWhitespace(handle(data, true, true) + '\n');
    }

    module.exports = {stringify}
})()
