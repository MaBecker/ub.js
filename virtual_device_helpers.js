/*jslint node: true */
/**
 * Virtual device helpers module
 * @module socket
 *
 * This module stores helpers for virtual devices
 *
 * @author Alex Owen
 */

'use strict';

/** Initialise the module
 *  @param config - configuration parameters
 */
exports.createDevice = (id, className, type) => {
    let helpers = ubRequire('helpers.js'),
        device_bus = global.device_bus,
        bus = global.bus;

    return new Promise((resolve, reject) => {
        let r = helpers.idGen();

        let callback = data => {
            if (typeof data.response !== 'undefined' && data.response.r === r) {
                device_bus.removeListener(type, callback);
                resolve();
            }
        };

        device_bus.on(type, callback);

        bus.emit('create', {
            r,
            o: id,
            dv: {
                id: id,
                class: className,
                attr: {
                    type: type
                }
            }
        });
    });
};

exports.createChannel = (channel, id, type) => {
    let helpers = ubRequire('helpers.js'),
        device_bus = global.device_bus,
        bus = global.bus;

    return new Promise((resolve, reject) => {
        let r = helpers.idGen();

        let callback = data => {
            if (typeof data.response !== 'undefined' && data.response.r === r) {
                device_bus.removeListener(type, callback);
                resolve();
            }
        };

        device_bus.on(type, callback);

        bus.emit('create', {
            r,
            o: id,
            ch: {
                id: channel
            }
        });

    });
};

exports.subscribeToChannel = (channel, id, type) => {
    let helpers = ubRequire('helpers.js'),
        device_bus = global.device_bus,
        bus = global.bus;

    return new Promise((resolve, reject) => {
        let r = helpers.idGen();

        let callback = data => {
            if (typeof data.response !== 'undefined' && data.response.r === r) {
                device_bus.removeListener(type, callback);
                resolve();
            }
        };

        device_bus.on(type, callback);

        bus.emit('update', {
            r,
            o: id,
            s: '#' + channel,
            ch: {
                subscribers: '+#' + id
            }
        });
    });
};

exports.sendUpdate = (origin, selector, message, type) => {
    let helpers = ubRequire('helpers.js'),
        device_bus = global.device_bus,
        bus = global.bus;

    return new Promise((resolve, reject) => {
        let r = helpers.idGen();

        let callback = data => {
            if (typeof data.response !== 'undefined' && data.response.r === r) {
                device_bus.removeListener(type, callback);
                resolve();
            }
        };

        device_bus.on(type, callback);

        message.r = r;
        message.o = origin;
        message.s = selector;

        bus.emit('update', message);
    });
};

exports.readDevice = (origin, selector, type) => {
    let helpers = ubRequire('helpers.js'),
        device_bus = global.device_bus,
        bus = global.bus,
        r = helpers.idGen();

    return new Promise((resolve, reject) => {
        let callback = data => {
            if (typeof data.response !== 'undefined' && data.response.r === r) {
                if (typeof data.response.d !== 'undefined') {
                    device_bus.removeListener(type, callback);
                    resolve(data.response.d);
                }
            }
        };

        device_bus.on(type, callback);

        let message = {
            r,
            o: origin,
            s: selector,
            dv: {}
        };

        bus.emit('read', message);
    });
};

exports.readDeviceCSS = (origin, selector, property, type) => {
    let helpers = ubRequire('helpers.js'),
        device_bus = global.device_bus,
        bus = global.bus,
        r = helpers.idGen();

    return new Promise((resolve, reject) => {
        let callback = data => {
            if (typeof data.response !== 'undefined' && data.response.r === r) {
                if (typeof data.response.d !== 'undefined') {
                    device_bus.removeListener(type, callback);
                    resolve(data.response.d);
                }
            }
        };

        device_bus.on(type, callback);

        let message = {
            r,
            o: origin,
            s: selector,
            dv: {
                css: property
            }
        };

        bus.emit('read', message);
    });
};
