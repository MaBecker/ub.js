/*jslint node: true */
'use strict';
exports.init = function(properties) {
	properties.forEach(function(property) {
		global.$.cssHooks[property] = {
			get: function(elem) {
				return elem.style[property];
			},
			set: function(elem, value) {
				elem.style[property] = value;
			}
		};
		global.$.cssNumber[property] = true;
	});
};
