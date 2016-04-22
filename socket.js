/*jslint node: true */
/**
 * Network socket device module
 * @module socket
 *
 * This module communicates with network devices via TCP sockets
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

	// get local IPs
	let IPs = [],
		os = require('os'),
		ifaces = os.networkInterfaces();

	Object.keys(ifaces).forEach(function (ifname) {
		let alias = 0;

		ifaces[ifname].forEach(function (iface) {
			if ('IPv4' !== iface.family || iface.internal !== false) {
				// skip internal non-IPv4 addresses
				return;
			}

			IPs.push({if: ifname, address: iface.address});
			++alias;
		});
	});

    let emitEvent = function(eventName, message) {
    	if (typeof message === 'string') message  = JSON.parse(message);
    	if (typeof message.r === 'undefined') message.r = helpers.idGen();
    	if (typeof message.o === 'undefined') message.o = id;
    	log.debug('Socket: ' + eventName + ' received: ' + JSON.stringify(message));
		bus.emit(eventName, message);
    };

	let net = require('net'),
		sockets = [];

	//	register an update handler
	bus.emit('register_update_handler', {socket: config.updateHandler});

	// Create a server instance, and chain the listen function to it
	// The function passed to net.createServer() becomes the event handler for the 'connection' event
	// The sock object the callback function receives UNIQUE for each connection
	net.createServer(socket => {

    	socket.setKeepAlive(true);
        socket.setTimeout(30000);   //timeout the socket if there is no connection for 30s

        // attempt a connection
        let rID = helpers.idGen();
	    socket.write(`{"read":{"r":"${rID}","o":"${config.id}","t":"discover"}}${config.terminator}`);

	    // We have a connection - a socket object is assigned to the connection automatically
	    log.debug('Socket: Connected: ' + socket.remoteAddress +':'+ socket.remotePort);

	    let id = '',
	    	cmd = '';
	    socket.removeAllListeners('data');
	    socket.on('data', input => {
            cmd += input;
            let idx = cmd.indexOf(config.terminator);
            while (idx >= 0) {
                let line = cmd.substr(0, idx),
                    message = {};
                cmd = cmd.substr(idx + 1);

                let validJSON = false;
	        	try {
	                message = JSON.parse(line);
	                validJSON = true;
	            } catch (e) {
	                log.debug('Socket: Error parsing response to JSON.');
	                validJSON = false;
	            }

	            if (validJSON) {
	            	if (typeof message.ping !== 'undefined') {
	            		socket.write(`{"pong":${message.ping}}${config.terminator}`);
	            		log.debug('Socket: ping pong');
	            	} else if (typeof message.create !== 'undefined') {
						emitEvent('create', message.create);
					} else if (typeof message.read !== 'undefined') {
						emitEvent('read', message.read);
					} else if (typeof message.update !== 'undefined') {
						emitEvent('update', message.update);
					} else if (typeof message.delete !== 'undefined') {
						emitEvent('delete', message.delete);
					} else if (typeof message.response !== 'undefined') {
						if (message.response.t === 'discover' && typeof message.response.dv.id !== 'undefined') {	//creating a new device
			    			id = message.response.dv.id;

							let device_message = {
								r: helpers.idGen(),
								o: config.id,
								dv: {
									id: message.response.dv.id,
									class: message.response.dv.class,
									attr: {
										type: 'socket',
										host: socket.remoteAddress,
										port: socket.remotePort
									}
								}
							};

			    			emitEvent('create', device_message);
	                    	log.debug(`Socket: ${message.response.dv.id} recognised.`);
			    			sockets[message.response.dv.id] = socket;
						} else if (message.response.t === 'update' && typeof message.response.dv.id !== 'undefined') {	//updating an existing device
							sockets[message.response.dv.id] = sockets[message.response.o];
							sockets[message.response.o] = undefined;
							bus.emit('response', message.response);
						} else {
							bus.emit('response', message.response);
						}
					} else {
						if (typeof message.o !== 'undefined') {
	                        log.debug(`Socket: Unrecognised event received from device: ${message.o}`);
	                    } else {
	                        log.debug('Socket: Unrecognised event received from unknown device.');
	                    }
					}
				}

	            idx = cmd.indexOf(config.terminator);
			}
		});

        let removeSocket = (id) => {
             if (typeof id !== 'undefined' && id !== '' && sockets[id] !== undefined && $('context #' + id).attr('port') == socket.remotePort) {
                let data = {};
                data.o = config.id;
                data.s = '#' + id;
                data.r = helpers.idGen();
                data.dv = {};
                emitEvent('delete', data);
                sockets[id] = undefined;
                log.debug('Socket: Removed device: ' + id);
            } else {
                log.debug('Socket: Didn\'t remove device: ' + id);
            }
        };

        socket.on('error', function() {
            socket.destroy();
        });

        socket.on('timeout', socket => {
            socket.destroy();
        });

	    // Add a 'close' event handler to this instance of net.Socket
	    socket.on('close', () => {
	        log.debug('Socket: Closed: ' + socket.remoteAddress +' '+ socket.remotePort);
	        removeSocket(id);
	    });

	}).listen(config.port, IPs[0].address);

	log.debug('Socket: Server listening on ' + IPs[0].address +':'+ config.port);

	let socketSend = message => {
		let type = '';

		if (typeof message.create !== 'undefined') {
			type = 'create';
		} else if (typeof message.read !== 'undefined') {
			type = 'read';
		} else if (typeof message.update !== 'undefined') {
			type = 'update';
		} else if (typeof message.delete !== 'undefined') {
			type = 'delete';
		} else if (typeof message.response !== 'undefined') {
			type = 'response';
		}

        let $device = $(message[type].s).closest('device');

		log.debug(`Socket: Sending message to ${$device}: ${JSON.stringify(message)}`);
	    if (typeof $device !== 'undefined' && typeof $device.attr('host') !== 'undefined' && typeof $device.attr('port') !== 'undefined') {
	    	if (typeof(message) === 'object') {
	        	try {
	        		message = JSON.stringify(message);
	        	} catch (e) {
					log.error(`Socket: Cannot stringify data: ${message}`);
	        	}
	        }
	        if (typeof message === 'string') {
		        if (message.indexOf(config.terminator) !== message.length) {
		            message = message + config.terminator;
		        }
	       		sockets[$device.attr('id')].write(message.replace('\n',''));
	        }
	    }
	};

	device_bus.on(config.updateHandler, data => {
	    socketSend(data);
	});
};
