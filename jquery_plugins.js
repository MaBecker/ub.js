/*jslint node: true */
'use strict';
exports.init = function() {
    let $ = global.$,
        helpers = global.helpers,
        log = global.log;

	//check of two sets of elements are equal
	$.fn.contentsEqual = function(compareTo) {
		return compareTo && this.length === compareTo.length && this.length === this.filter(compareTo).length;
	};

    $.isValidProperty = function(property) {
        let isValid = false;
        if ($.validProperties.indexOf(property) > -1) isValid = true;
        if (property.indexOf('-') === 0) isValid = true;
        return isValid;
    };

    $.fn.css = function(property, value) {
        let set = (newProperty, newValue) => {
                let style = {},
                    styleString = '',
                    rules = [];

                let styleAttr = this.attr('style');
                if (typeof styleAttr !== 'undefined') {
                    rules = this.attr('style').split(';');
                }

                for (let rule in rules) {
                    if (rules[rule].length > 1 && rules[rule].indexOf(':') > -1) {
                        let property = rules[rule].split(':')[0],
                            value = rules[rule].split(':')[1];
                        style[helpers.toCamelCase(property)] = value;
                    }
                }

                style[helpers.toCamelCase(newProperty)] = newValue;

                for (let rule in style) {
                    if (style.hasOwnProperty(rule) && typeof style[rule] !== 'undefined') {
                        styleString += `${helpers.toHyphenCase(rule)}:${style[rule]};`;
                    }
                }

                this.attr('style', styleString);
            },

            get = property => {
                property = helpers.toHyphenCase(property);
                if (typeof this.attr('style') !== 'undefined') {
                    let rules = this.attr('style').split(';');
                    for (let rule in rules) {
                        if (rules[rule].length > 1 && rules[rule].indexOf(':') > -1) {
                            if (rules[rule].split(':')[0] === property) {
                                return rules[rule].split(':')[1];
                            }
                        }
                    }
                } else {
                    return '';
                }
            };

        if (typeof property === 'string' && typeof value === 'string') {
            if ($.isValidProperty(property)) set(property, value);
        } else if (typeof property === 'object') {
            for (let rule in property) {
                if (property.hasOwnProperty(rule)) {
                    if ($.isValidProperty(rule)) set(rule, property[rule]);
                }
            }
            return this;
        } else if (typeof property === 'string' && typeof value === 'undefined') {
            if ($.isValidProperty(property)) return get(property);
        }

        return this;
    };
};
