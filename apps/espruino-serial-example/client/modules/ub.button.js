//*** Button ***/
exports = function(pin, channel, eventName) {
    var power = 'on';
    var action = function() {
        log('button');
        bus.emit('u', {
            s: '#' + channel,
            ch: {
                d: eventName
            }
        });
    };

    if (eventName === undefined) {
        data = {
            eventName: 'button_press'
        };
    }

    pinMode(pin, 'input_pullup');

    setWatch(action, pin, {
        debounce: 50,
        edge: 'falling',
        repeat: true
    });

    return {};
};
