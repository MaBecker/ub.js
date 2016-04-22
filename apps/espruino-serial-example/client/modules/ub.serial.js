/*** Serial ***/
exports = function(config) {
    var terminator = '\n',
        cmd = '',
        line = '',
        message = {};

    config.consoleSerial.setConsole();

    config.serial.setup(config.baud);


    // adapted from http://www.espruino.com/USART
    config.serial.on('data', function(data) {
        cmd += data;
        var idx = cmd.indexOf(terminator);
        while (idx >= 0) {
            line = cmd.substr(0, idx);
            message = {};
            cmd = cmd.substr(idx + 1);
            validJSON = false;
            try {
                message = JSON.parse(line);
                if (typeof message === 'object') validJSON = true;
            } catch (e) {}

            if (validJSON) bus.emit('i', message);

            idx = cmd.indexOf(terminator);
        }
    });

    exports.send = function(data) {
        data = JSON.stringify(data);
        if (data.charAt(data.length - 1) !== terminator) data += terminator;
        config.serial.print(data);
    };

    bus.on('s', exports.send);
};
