exports = function(config, callback) {
    var e = {},
        connectAttempts = 0,
        wifi = require('Wifi'),
        connected = false;

    e.on('ap', function() {
        wifi.startAP(device.id, {
            channel: 6,
            authMode: 'wpa2',
            password: 'password'
        }, function(err) {
            console.log('AP: ' + device.id, err);
            require('http').createServer(function(req, res) {
                var query = url.parse(req.url, true).query;
                console.log(req.url);
                if (url.parse(req.url, true).pathname === '/') {
                    res.writeHead(200);
                    var page = {h:'<html><form action="/u">SSID:<input name=ssid/>Password:<input type=password name=pw/>Hub IP:<input name=ip/><input type=submit value=Save/></form></html>'};
                    res.end(page.h);
                } else if (url.parse(req.url, true).pathname === '/u') {
                    if (query && 'ssid' in query) {
                        query.ssid = query.ssid.replace('+', ' ');
                        query.ssid = query.ssid.replace('+', ' ');
                        config.ssid = query.ssid;
                    }
                    if (query && 'pw' in query) {
                        config.pw = query.pw;
                    }
                    if (query && 'ip' in query) {
                        hubIp = query.ip;
                    }
                    e.emit('sc');
                }
            }).listen(80);
        });
    });

    e.on('sc', function(err) {
        wifi.stopAP(function() {
            connected = false;
            if (!err) {
                connectAttempts++;
                wifi.scan(function(results) {
                    var found = false;
                    for (var result in results) {
                        if (results[result].ssid === config.ssid) {
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
                    setTimeout(function() {
                        e.emit('sc');
                    }, config.reconnectTimeout);
                }
            }
        });
    });

    e.on('co', function() {
        wifi.setHostname(device.id);
        wifi.connect(config.ssid, {
            password: config.pw
        }, function(err) {
            if (callback !== undefined) {
                connected = true;
                callback();
            }
        });
    });

    e.emit('sc');
};
