/*jslint node: true*/
/**
 * 433MHz Plug Sockets module
 * @module plug_sockets
 *
 * This module connects to 433MHz plug sockets using a custom protocol to a serailly connected Arduino
 *
 * @author Alex Owen
 */

'use strict';

/** Initialise the module
 *  @param config - configuration parameters
 */
exports.init = config => {
    let bus = global.bus,
        log = global.log,
        helpers = global.helpers,
        $ = global.$,
        device_bus = global.device_bus;

    bus.emit('create', {
        r: helpers.idGen(),
        o: config.id,
        dv: {
            id: config.id
        }
    });

    let serialPort = require('serialport');
    let port = new serialPort(config.port, {'baudrate': config.speed, 'autoOpen': false});
    port.open(error => {
        if (error) {
            log.error(`Plug Sockets: error opening port: ${config.port}`);
        } else {
            log.debug(`Plug Sockets: opened port: ${config.port}`);
        }
    });

    //	register an update handler
	bus.emit('register_update_handler', {plug_socket: config.updateHandler});

    // add all the specified devices
    for (let device in config.devices) {
        let device_message = {
            r: helpers.idGen(),
            o: config.id,
            dv: {
                id: config.devices[device].id,
                class: config.devices[device].class,
                attr: {
                    type: config.updateHandler
                }
            }
        };

        bus.emit('create', device_message);
    }

    let send = data => {
        if (typeof data.update !== 'undefined' && typeof data.update.dv !== 'undefined' && typeof data.update.dv.css !== 'undefined' && typeof data.update.dv.css.power !== 'undefined') {
            let deviceName = $(data.update.s).attr('id');
            let channel = -1;
            let subChannel = -1;
            let command = '';
            for (let device in config.devices) {
                if (config.devices[device].id === deviceName) {
                    channel = config.devices[device].channel;
                    subChannel = config.devices[device].subChannel;
                }
            }
            let power = -1;
            if (data.update.dv.css.power === 'on') {
                power = 1;
            } else if (data.update.dv.css.power === 'off') {
                power = 0;
            }

            if (channel !== -1 && subChannel !== -1 && power !== -1) {
                command = `C${channel}S${subChannel}D${power}`;
            }

            log.debug('Plug Sockets: sending command: ' + command);
            port.write(command + '\n', (err, results) => {
                if (typeof err !== 'undefined' && err !== null) {
                    log.error('Plug Sockets: ' + err);
                }
                if (typeof results !== 'undefined') {
                    log.debug('Plug Sockets: ' + results);
                }
            });
        }
    };

    device_bus.on(config.updateHandler, data => {
        log.debug('Plug Sockets: received data: ' + JSON.stringify(data));
        send(data);
    });
};
