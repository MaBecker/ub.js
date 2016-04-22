/*
 * Espruino client example
 *
 * Connects to the Hub via WiFi, TCP sockets and JSON
 * Creates a channel then publishes 'temperature' and 'humidity' data to it from a DHT22 module
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
var wifiSSID = '',
    wifiPassword = '';

var ESP8266 = require('ESP8266');
ESP8266.logDebug(false);
ESP8266.setLog(0);

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
    id: 'dht22_01',
    class: 'environmental',
    clientVersion: '0.1.0'
};

setInterval(
    function() {
        E.getErrorFlags().forEach(function(i, e) {
            if (e === 'MEMORY') {
                require('ESP8266').reboot();
            }
        });
    }, 1000);


var ub = require('ub');
var wifi_lib = require('ub.wifi');
var socket_lib = require('ub.socket');
var dht22_lib = require('ub.dht22');

E.on('init', function() {

    var ubConfig = {
        functions: {},
        reconnect: true,
        reconnectTimeout: 10000
    };

    /*** DHT22 ***/

    dht22_lib({
        pin: 2,
        channel: 'environment',
        interval: 60000,
        temp_id_prefix: 'temp_',
        humidity_id_prefix: 'rh_'
    });

    ub(ubConfig);

    wifi_lib({
        ssid: wifiSSID,
        pw: wifiPassword,
        maxConnectAttempts: 5,
        reconnectTimeout: 5000
    }, function() {
        socket_lib({
            host: '192.168.0.40',
            port: 3001,
            reconnect: true
        }, function() {
            bus.emit('c',{ch:{id:'environment'}});
        });
    });
});
