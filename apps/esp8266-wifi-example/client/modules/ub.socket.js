/*** Socket ***/
exports = function(config, callback) {
    var e = {},
        terminator = '&',
        cmd = '',
        tcpSocket;

    bus.on('di', function() {
        if (tcpSocket !== undefined) tcpSocket.end();
        e.emit('co');
    });

    e.on('da', function(inp) {
        var line = '',
            message = {},
            validJSON = false,
            idx = -1;

        cmd += inp;
        idx = cmd.indexOf(terminator);
        while (idx >= 0) {
            line = cmd.substr(0, idx);
            message = {};
            cmd = cmd.substr(idx + 1);
            validJSON = false;
            try {
                //log(line);
                message = JSON.parse(line);
                if (typeof message === 'object') validJSON = true;
            } catch (e) {
                //log('ERR:Parse');
            }

            if (validJSON) bus.emit('i', message);

            idx = cmd.indexOf(terminator);
        }
    });

    e.on('co', function() {
        tcpSocket = require('net').connect({
            host: config.host,
            port: config.port
        }, function(err) {
            tcpSocket.on('data', function(inp) {
                e.emit('da', inp);
            });
            if (callback !== undefined) callback();
        });
    });

    exports.send = function(data) {
        var messageString = JSON.stringify(data);
        if (messageString.charAt(messageString.length - 1) !== terminator) messageString += terminator;
        if (tcpSocket) {
            tcpSocket.write(messageString);
        }
    };
    bus.on('s', exports.send);

    e.emit('co');
};
