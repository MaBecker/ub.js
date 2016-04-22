/*** DHT22 ***/
exports = function(config) {
    var tempID = config.temp_id_prefix + (global.getRandom().toString(36) + '00000000000000000').slice(2, 7),
        rhID = config.humidity_id_prefix + (global.getRandom().toString(36) + '00000000000000000').slice(2, 7);

    global.registerComponent(tempID, 'temperature');
    global.registerComponent(rhID, 'humidity');

    pinMode(config.pin, 'input_pullup');

    var dht = require('DHT22').connect(config.pin);

    setInterval(function() {
        dht.read(function(data) {
            if (!data.error) {
                bus.emit('u', {
                    s: '#' + config.channel,
                    ch: {
                        d: {
                            temperature: data.temp,
                            humidity: data.rh
                        }
                    }
                });
            } else {
                console.log(data);
            }
        });
    }, config.interval);

    return {};
};
