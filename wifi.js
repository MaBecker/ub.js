/*jslint node: true */
/**
 * Network device module
 * @module wifi
 *
 * This module communicates with network devices
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
        $ = global.$,
        device_bus = global.device_bus,
        helpers = global.helpers;

	bus.emit('create', {
		r: helpers.idGen(),
		o: config.id,
		dv: {
			id: config.id
		}
	});

	let request = require('request');

	/*
	 * Add any manually specified devices
	 */
	if (typeof config.devices  !== 'undefined' && config.devices.length !== 0) {
		//add all the devices specified in the config
		config.devices.forEach(dv => {
			let device_message = {
				r: helpers.idGen(),
				o: config.id,
				dv
			};

			device_message.dv.attr.type = 'network';

			bus.emit('create', device_message);
		});
	}

	//	register an update handler
	bus.emit('register_update_handler', {network: config.updateHandler});

	let netSend = message => {
		let $device = {};
		if ($(message.update.s).is('component')) {
			$device = $(message.update.s).closest('device');
		} else {
			$device = $(message.update.s);
		}

		log.debug(`Network: Sending message to ${$device}: ${JSON.stringify(message)}`);
	    if (typeof $device !== 'undefined' && typeof $device.attr('ip') !== 'undefined' && typeof $device.attr('port') !== 'undefined') {

	        let options = {
	        	method: 'POST',
				url: `http://${$device.attr('ip')}:${$device.attr('port')}/`,
				json: true,
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': JSON.stringify(message).length
				},
				body: message
			};

			let callback = (error, response, body) => {
				if (!error && response.statusCode === 200) {
					log.debug(`Network: Sent message to http://${$device.attr('ip')}:${$device.attr('port')}/ (${message.update.s})`);
				} else {
					log.error(`Network: Error sending message to ${message.update.s}`);
				}
			};

			request(options, callback);
	    } else {
	        log.error(`Network: Cannot send data to ${message.update.s}: ${JSON.stringify(message)}`);
	    }
	};

	device_bus.on(config.updateHandler, data => {
    	/*let $elem = $(data.s),
    		$device = {};*/

    	/*if ($elem.is('device')) {
    		$device = $elem;
    	} else if ($elem.is('component')) {
    		$device = $elem.closest('device');
    	}*/

	    netSend(data);
	});

    /*device_bus.on('response', function(data) {

    });*/
};
