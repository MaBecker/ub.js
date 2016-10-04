/*jslint node: true */
'use strict';
exports.init = function(config, callback) {
    let socketIO = require('socket.io-client'),
        events = require('events'),
        e = new events.EventEmitter(),
        bus = global.bus,
        socket;

    e.on('co', function() {
        socket = socketIO(`http://${config.host}:${config.port}`);

        socket.on('connect', () => {});

        socket.on('create', data => {
            bus.emit('i', {create: data});
        });

        socket.on('read', data => {
            console.log('receive',{read: data});
            bus.emit('i', {read: data});
        });

        socket.on('update', data => {
            bus.emit('i', {update: data});
        });

        socket.on('delete', data => {
            bus.emit('i', {delete: data});
        });

        socket.on('response', data => {
            bus.emit('i', {response: data});
        });

        socket.on('disconnect', () => {});
    });

    bus.on('di', () => {
        e.emit('co');
    });

    bus.on('hc', () =>{
        console.log(typeof callback);
        if (typeof callback === 'function') {
            callback();
        }
    });

    exports.send = function(data) {
        console.log('send:',data);
        if (typeof data.create !== 'undefined') {
            socket.emit('create', data.create);
        } else if (typeof data.read !== 'undefined') {
            socket.emit('read', data.read);
        } else if (typeof data.update !== 'undefined') {
            socket.emit('update', data.update);
        } else if (typeof data.delete !== 'undefined') {
            socket.emit('delete', data.delete);
        } else if (typeof data.response !== 'undefined') {
            socket.emit('response', data.response);
        }
    };

    bus.on('s', exports.send);

    e.emit('co');
};
