/*jslint node: true */

/*  Events:
 *
 *  - send: s
 *  - do an action: a
 *  - ping: p
 *  - message: m
 *  - connect: co
 *  - disconnect: di
 *  - handshake: h
 *  - handshake complete: hc
 *  - interpret: i
 *  - update: u
 *  - create: c
 *  - delete: d
 *  - read: r
 *  - new data: da
 */

'use strict';
exports.init = function(config) {
    var e;
    if (config.clientType === 'node') { // Node client
        var events = require('events');
        e = new events.EventEmitter();
    } else {    // Espruino client
        e = {};
    }
    var timeout,
        bus = global.bus,
        log = console.log,
        device = global.device,
        components = global.components,
        getRandom = global.getRandom;

    e.on('p', function() {
        bus.connectionAlive = 2; // 0: disconnected, 1: connected, 2: unknown

        timeout = setTimeout(function() {
            if (bus.connectionAlive === 2) {
                bus.connectionAlive = 0;
                bus.emit('di');
            }
        }, config.reconnectTimeout);

        bus.emit('s', {
            ping: parseInt(Date.now(), 10)
        });
    });

    bus.on('m', function() {
        bus.connectionAlive = 1;
        try {
            //clearTimeout(timeout); //should have this, but it crashes on 1v84
        } catch (e) {
            log(e);
        }
    });

    if (config.reconnect && config.reconnectTimeout) {
        e.emit('p');

        setInterval(function() {
            e.emit('p');
        }, 2 * config.reconnectTimeout);
    }

    /* Incoming commands */

    /* Handshake */
    e.on('h', function(data) {
        var message = {
            r: data.r,
            t: 'discover',
            st: 1,
            dv: device
        };
        bus.emit('s', prep('response', message));
        bus.emit('hc');

        for (var componentID in components) {
            message = {
                cm: {
                    id: componentID,
                    class: components[componentID],
                    p: device.id
                }
            };
            bus.emit('s', prep('create', message));
        }
    });

    /* Run a command from a JSON message */

    bus.on('i', function(data) {
        console.log(data);
        if (data) {
            bus.emit('m');
            if (data.read) {
                if (data.read.t && data.read.t === 'discover') e.emit('h', data.read);
            } else if (data.update) {
                e.emit('a', data.update);
            }
        }
    });

    e.on('a', function(data) {
        if (data.dv) {
            if (data.dv.css) {
                var componentID = data.s.replace('#', '');
                if (components[componentID] !== undefined) {
                    for (var prop in data.dv.css) {
                        if (config.functions[componentID][prop] !== undefined) config.functions[componentID][prop](data.dv.css[prop]);
                    }
                }
            }
            var message = {};
            if (data.dv.id) {
                message = {
                    r: data.r,
                    t: 'update',
                    o: device.id,
                    dv: data.dv
                };
                try {
                    device.id = data.dv.id;
                    message.st = 1;
                } catch (e) {
                    message.st = 0;
                }
                bus.emit('s', prep('response', message));
            }

            if (data.dv.class) {
                message = {
                    r: data.r,
                    t: 'update',
                    o: device.id,
                    dv: data.dv
                };

                try {
                    var classes = [],
                        i = -1;
                    if (data.dv.class.indexOf('+') > -1) {
                        classes = data.dv.class.substring(1).split(' ');
                        for (i = 0; i < classes.length; i++) {
                            if (device.class.indexOf(classes[i]) === -1) {
                                device.class += ' ' + classes[i];
                            }
                        }
                    } else if (data.dv.class.indexOf('-') > -1) {
                        for (i = 0; i < classes.length; i++) {
                            if (device.class.indexOf(classes[i]) !== -1) device.class.splice(device.class.indexOf(classes[i]), classes[i].length);
                        }
                    } else {
                        device.class = data.dv.class;
                    }
                    message.st = 1;
                } catch (e) {
                    message.st = 0;
                }
                bus.emit('s', prep('response', message));
            }
        }
    });

    /* Outgoing commands */

    /* create */
    /*exports.ub.create = function(params) {
      exports.send(prep('create', params));
    };*/
    bus.on('c', function(params) {
        bus.emit('s', prep('create', params));
    });

    /* read */
    /*exports.ub.read = function(params) {
      exports.send(prep('read', params));
    };*/
    bus.on('r', function(params) {
        bus.emit('s', prep('read', params));
    });

    /* update */
    /*exports.ub.update = function(params) {
      exports.send(prep('update', params));
    };*/
    bus.on('u', function(params) {
        bus.emit('s', prep('update', params));
    });

    /* delete */
    /*exports.ub.delete = function(params) {
      exports.send(prep('delete', params));
    };*/
    bus.on('d', function(params) {
        bus.emit('s', prep('delete', params));
    });

    /* Create a request ID */
    var idGen = function() {
            return (getRandom().toString(36) + '00000000000000000').slice(2, 7);
        },
        prep = function(type, params) {
            var message = {};
            if (!params.r) params.r = idGen();
            if (!params.o) params.o = device.id;
            message[type] = params;
            return message;
        };
};
