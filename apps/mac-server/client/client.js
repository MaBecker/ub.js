/*jslint node: true */
'use strict';
let config = JSON.parse(require('fs').readFileSync('./config.json', 'utf8'));
let events = require('events');
let ub = require('./ub.js');
let websocket_lib = require('./modules/ub.socketio.js');

global.device = config.device;
let bus = global.bus = new events.EventEmitter();
let components = global.components = [];

global.registerComponent = (id, className) => {
    components[id] = className;
};
global.getRandom = () => {
    return Math.random();
};

let ubConfig = {
    functions: {},
    reconnect: false,
    clientType: 'node'
};

ub.init(ubConfig);

websocket_lib.init({
    host: config.hubIp,
    port: config.hubPort
}, function() {
    bus.emit('c',{ch:{id:'node'}});
});
