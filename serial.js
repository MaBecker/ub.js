/*jslint node: true */
/**
 * Serial device module
 * @module serial
 *
 * @author Alex Owen
 */


/** Initialise the module
 *  @param config - configuration parameters
 */
exports.init = config => {
    'use strict';

	bus.emit('create', {
		r: helpers.idGen(),
		o: config.id,
		dv: {
			id: config.id
		}
	});

	let serialPort = require('serialport'),
	    events = require('events'),
		known_ports = [],
		serial_bus = new events.EventEmitter();

	//	register an update handler
	bus.emit('register_update_handler', {serial: config.updateHandler});

	/**
	 *	Polls the list of connected serial devices. If a new device is added it fires a new_serial_port event on the serial bus
	 */
	setInterval(() => {
		serialPort.list((err, ports) => {
			if (typeof ports  !== 'undefined' && ports.length > 0) {
				ports.forEach(new_port => {
					if (config.exclusions.indexOf(new_port.comName) === -1) {
						if (typeof known_ports[new_port.comName] === 'undefined') {
							serial_bus.emit('new_serial_port', new_port.comName);
						}
					}
				});
			}
		});
	}, config.refreshInterval);

	/**
	 *	When a new serial device is found, run some code.
	 */
	serial_bus.on('new_serial_port', port_name => {
		let port = new serialPort(port_name, {'baudrate': config.speed, 'autoOpen': false});
		known_ports[port_name] = port;
		log.debug(`Serial: New serial port: ${port_name}`);
	    known_ports[port_name].once('open', () => {
	        let cmd = '';
	        known_ports[port_name].removeAllListeners('data');
	        known_ports[port_name].on('data', input => {
	            cmd += input;
	            let idx = cmd.indexOf('\n');
	            while (idx>=0) {
	                let line = cmd.substr(0,idx),
	                    message = {};
	                cmd = cmd.substr(idx+1);
	                log.debug(`Serial: Data received from ${port_name}: ${line}`);

	                let validJSON = false;
	                try {
	                    message = JSON.parse(line);
	                    validJSON = true;
	                } catch (e) {
	                    log.debug('Serial: Error parsing response to JSON');
	                    validJSON = false;
	                }

	                if (validJSON) {
						if (typeof message.create !== 'undefined') {
							bus.emit('create', message.create);
						} else if (typeof message.read !== 'undefined') {
							bus.emit('read', message.read);
						} else if (typeof message.update !== 'undefined') {
							bus.emit('update', message.update);
						} else if (typeof message.delete !== 'undefined') {
							bus.emit('delete', message.delete);
						} else if (typeof message.response !== 'undefined') {
							if (message.response.t === 'discover' && typeof message.response.dv.id !== 'undefined') {

								let device_message = {
									r: helpers.idGen(),
									o: config.id,
									dv: {
										id: message.response.dv.id,
										class: message.response.dv.class,
										attr: {
											type: 'serial',
											port: port_name,
											speed: config.speed
										}
									}
								};

				    			bus.emit('create', device_message);
	                        	log.debug(`Serial: ${message.response.dv.id} recognised on port: ${port_name}`);
							}/* else {
								bus.emit('response', message.response);
							}*/
                        } else if (typeof message.ping !== 'undefined') {
    	            		known_ports[port_name].write(`{"pong":${message.ping}}\n`);
    	            		log.debug('Serial: ping pong');
						} else {
							if (typeof message.o !== 'undefined') {
	                            log.debug(`Serial: Unrecognised event received from serial device: ${message.o}`);
	                        } else {
	                            log.debug('Serial: Unrecognised event received from unknown serial device.');
	                        }
						}
					}

	                idx = cmd.indexOf('\n');
	            }
	        });

			/**
			 * 5 seconds after discovery, send the device a device_info_read event to see if it is compatible
			 */
	    	setTimeout(() => {
	    		let r = helpers.idGen();
	    		known_ports[port_name].write(`{"read":{"r":"${r}","o":"SERIAL","t":"discover"}}\n`, function(err, results) {
					log.debug('Serial: Device plugged in on port: ' + port_name);
		        });
	    	}, 5000);

	    	/*
	    	 * When a device is disconnected, remove it from the DOM and stop listening to that port
	    	 */
	        known_ports[port_name].once('close', () => {
	        	log.debug(`Serial: Device unplugged on port: ${port_name}`);
	        	known_ports[port_name].removeAllListeners('data');
	        	known_ports[port_name] = undefined;
		    	let data = {};
		    	data.o = config.id;
		    	data.s = `device[port="${port_name}"]`;
		    	data.r = helpers.idGen();
		    	data.dv = {};
		    	bus.emit('delete', data);
	        });
	    });

		known_ports[port_name].open(error => {
			if (error) {
	    		log.error(`Serial: ${error}`);
	    	}
		});
	});

	/*
	 * Helper method for sending data to a serial devices
	 * @param message {object/string}
	 */
	let send = message => {
        if (typeof message !== 'undefined' && typeof message.update !== 'undefined' && message.s !== 'undefined') {
    		let $device = {};
    		if ($(message.update.s).is('component')) {
    			$device = $(message.update.s).closest('device');
    		} else {
    			$device = $(message.update.s);
    		}
    		log.debug(`Serial: Sending data to ${$device}: ${JSON.stringify(message)}`);
    	    if (typeof $device !== 'undefined' && typeof $device.attr('port') !== 'undefined') {
    	        if (typeof(message) === 'object') {
    	        	try {
    	        		message = JSON.stringify(message);
    	        	} catch (e) {
    					log.error(`Serial: Cannot stringify data: ${message}`);
    	        	}
    	        }
    	        if (typeof message === 'string') {
    		        if (message.indexOf('\n') !== message.length) {
    		            message = message + '\n';
    		        }
    	       		known_ports[$device.attr('port')].write(message, (err, results) => {});
    	        }

    	    } else {
    	        log.error(`Serial: Cannot send data to ${message.update.s}: ${message}`);
    	    }
        }
	};

	/*
	 * When a message_publish event intended for a serial devcie is received on the bus, send the data attached to it to the correct device
	 */
	device_bus.on(config.updateHandler, data => {
    	/*let $elem = $(data.s),
    		  device = {};*/

    	/*if ($elem.is('device')) {
    		$device = $elem;
    	} else if ($elem.is('component')) {
    		$device = $elem.closest('device');
    	}*/

	    send(data);
	});

    /*device_bus.on('response', function(data) {

    });*/
};
