/*jslint node: true */
'use strict';
exports.idGen = () => {
	return (Math.random().toString(36) + '00000000000000000').slice(2, 7);
};

exports.eventTypes = () => {
	return [
		'create',
		'read',
		'update',
		'delete'
	];
};

exports.uuidGen = () => {
	return require('node-uuid').v4();
};

exports.componentIDGen = () => {
    return 'component_' + exports.uuidGen();
};

exports.toCamelCase = str => {
    return str.replace(/-([a-z])/g, c => {return c[1].toUpperCase();});
};

exports.toHyphenCase = str => {
    return str.replace(/([a-z][A-Z])/g, c => {return c[0] + '-' + c[1].toLowerCase();});
};
