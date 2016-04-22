/*jslint node: true */
/**
 * WebSocket device module
 * @module websocket
 *
 * @see plugins/web_ui
 *
 * @author Alex Owen
 */

'use strict';

/** Initialise the module
 *  @param config - configuration parameters
 */
exports.init = (config, params) => {

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

	let io = require('socket.io'),
		events = require('events'),
	    sockets = [];

	// register an update handler
	bus.emit('register_update_handler', {websocket: config.updateHandler});

	io.listen(params.server).on('connection', socket => {
	    log.debug('WebSocket: A user connected to port: ' + params.server.address().port);
	    let r = helpers.idGen();

	    socket.emit('read', {
	    	r,
	    	o: config.id,
	    	t: 'discover'
	    });

	    let id = '';
	    socket.on('response', message => {
	    	if (typeof message !== 'undefined' && message.t === 'discover' && typeof message.dv.id !== 'undefined') {
		    	id = message.dv.id;
				log.debug('WebSocket: adding device: ' + message.dv.id);

				if (typeof message.dv.class === 'undefined') message.dv.class = '';

				let device_message = {
					r: helpers.idGen(),
					o: config.id,
					dv: {
						id: message.dv.id,
						class: message.dv.class,
						attr: {
							type: 'websocket',
							port: params.server.address().port
						}
					}
				};

    			bus.emit('create', device_message);
	            log.debug(`WebSocket: Adding ${message.dv.id}: ${JSON.stringify(device_message)}`);
		    	sockets[message.dv.id] = socket;
		    } else {
		    	log.error('WebSocket: device attempting to connect has an undefined id');
		    }

		    //forward events from the client, only if the device has completed the handshake
			for (let i in helpers.eventTypes()) {
			    (e => {
			    	socket.on(e, message => {
			    		emitEvent(e, message);
			    	});
			    })(helpers.eventTypes()[i]);
			}
	    });

	    socket.on('disconnect', () => {
	    	let data = {};
	    	data.o = config.id;
	    	data.s = '#' + id;
	    	data.r = helpers.idGen();
	    	data.dv = {};
	    	bus.emit('delete', data);
	    	sockets[id] = undefined;
	    });

	    //helper method
	    let emitEvent = (eventName, message) => {
	    	if (typeof(message) === 'string') message  = JSON.parse(message);
	    	if (typeof(message.r) === 'undefined') message.r = helpers.idGen();
	    	if (typeof(message.o) === 'undefined') message.o = id;
	    	log.debug('WebSocket: ' + eventName + ' received: ' + JSON.stringify(message));
			bus.emit(eventName, message);
	    };
	});

	//send data via a websocket
    device_bus.on(config.updateHandler, message => {
    	if (typeof message.update !== 'undefined') {
    		if (typeof(sockets) !== 'undefined') {
    			if (typeof(sockets[message.update.s.replace('#', '')]) !== 'undefined') {
					log.debug('WebSocket: Sending data to ' + message.update.s + ': ' + JSON.stringify(message.update));
		        	sockets[message.update.s.replace('#', '')].emit('update', JSON.stringify(message.update));
    			} else if ($(message.update.s).is('component') && typeof(sockets[$(message.update.s).closest('device').attr('id').replace('#', '')]) !== 'undefined') {
					log.debug('WebSocket: Sending data to ' + message.update.s + ': ' + JSON.stringify(message.update));
		        	sockets[$(message.update.s).closest('device').attr('id').replace('#', '')].emit('update', JSON.stringify(message.update));
	        	}
	        } else {
	        	log.error(`WebSocket: ${message.update.s} does not exist`);
	        }
    	} else if (typeof message.response !== 'undefined') {
    		if (typeof(sockets) !== 'undefined') {
    			if (typeof(sockets[message.response.s.replace('#', '')]) !== 'undefined') {
					log.debug('WebSocket: Sending data to ' + message.response.s + ': ' + JSON.stringify(message.response));
	        		sockets[message.response.s.replace('#', '')].emit('response', JSON.stringify(message.response));
    			} else if ($(message.response.s).is('component') && typeof(sockets[$(message.response.s).closest('device').attr('id').replace('#', '')]) !== 'undefined') {
					log.debug('WebSocket: Sending data to ' + message.response.s + ': ' + JSON.stringify(message.response));
	        		sockets[$(message.response.s).closest('device').attr('id').replace('#', '')].emit('response', JSON.stringify(message.response));
	        	}
	        } else {
	        	log.error(`WebSocket: ${message.response.s} does not exist`);
	        }
    	}
    });

    /*device_bus.on('response', function(data) {

    });*/
};
