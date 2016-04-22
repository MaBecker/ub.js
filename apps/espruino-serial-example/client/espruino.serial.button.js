/*
 * Espruino client example
 *
 * Connects to the Hub via serial and JSON
 * Creates a channel, then publishes a message to it when a button is pressed
 *
 */

/*  Events:
 *
 *  - send: s
 *  - do an action: a
 *  - ping: p
 *  - message: m
 *  - connect: co
 *  - disconnect: di
 *  - handshake: h
 *  - interpret: i
 *  - update: u
 *  - create: c
 *  - delete: d
 *  - read: r
 *  - new data: da
 */

global.bus = {};
global.components = [];
global.registerComponent = function(id, className) {
    components[id] = className;
};
global.getRandom = function() {
    var r = getTime() * 1000;
    r -= parseInt(r, 10);
    return r;
};

global.device = {
    id: 'serial_button_01',
    class: 'button',
    clientVersion: '0.1.0'
};

var ub = require('ub');
var serial_lib = require('ub.serial');
var button = require('ub.button');

E.on('init', function() {

    var ubConfig = {
        functions: {},
        reconnect: true,
        reconnectTimeout: 10000
    };

    button(2, 'button', 'button_press');

    ub(ubConfig);

    serial_lib({
        serial: Serial1,
        baud: "115200",
        consoleSerial: USB      // you have to move the console away from the serial port you want to communicate with
    });

    setTimeout(function() {     // after 15 seconds, create a channel. currently there's not a connect event to trigger this
        bus.emit('c',{ch:{id:'button'}});
    }, 15000);
});
