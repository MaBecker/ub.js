/*jslint node: true */
'use strict';
exports = function(config, callback) {
    let e = {},
        connectAttempts = 0,
        wifi = require('wifi-control'),
        connected = false;

    e.on('sc', err => {
        connected = false;
        if (!err) {
            connectAttempts++;
            wifi.scanForWiFi((err, response) => {
                let found = false;
                for (let result in response.networks) {
                    if (response.networks[result].ssid === config.ssid) {
                        found = true;
                    }
                }
                if (found) {
                    console.log('co');
                    e.emit('co');
                } else {
                    console.log('ap');
                    e.emit('ap');
                }
            });
        } else if (err !== null && err.errorCode && err.errorCode !== 0) {
            if (connectAttempts < config.maxConnectAttempts) {
                setTimeout(() => {
                    e.emit('sc');
                }, config.reconnectTimeout);
            }
        }
    });

    e.on('co', function() {
        let results = wifi.connectToAP({
            ssid: config.ssid,
            password: config.pw
        });
        if (results.success) {
            if (callback !== undefined) {
                connected = true;
                callback();
            }
        }
    });

    wifi.init({
        debug: true
    });

    e.emit('sc');
};
