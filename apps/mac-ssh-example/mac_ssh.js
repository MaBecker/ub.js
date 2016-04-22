/*jslint node: true*/
/**
 * SSH Mac module
 * @module mac_ssh
 *
 * This module connects to Macs over SSH. SSH keys must have already been set up.
 *
 * @author Alex Owen
 */

'use strict';

/** Initialise the module
 *  @param config - configuration parameters
 */
exports.init = config => {

    let app = "Spotify"; // Spotify also works

    let bus = global.bus,
        log = global.log,
        helpers = global.helpers,
        $ = global.$,
        device_bus = global.device_bus,
        node_ssh = require('node-ssh'),
        sessions = {};

    bus.emit('create', {
        r: helpers.idGen(),
        o: config.id,
        dv: {
            id: config.id
        }
    });

    // register an update handler
	bus.emit('register_update_handler', {mac_ssh: config.updateHandler});

    bus.emit('register_termination_handler', () => {
        return new Promise((resolve, reject) => {
            if (typeof sessions !== 'undefined') {
                for (let session in sessions) {
                    log.debug('Mac SSH: closing ssh session: ' + session);
                    sessions[session].end();
                }
            }
            resolve();
        });
    });

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

        let ssh = new node_ssh();
        ssh.connect({
            host: config.devices[device].host,
            username: config.devices[device].username,
            privateKey: config.devices[device].privateKey
        }).then(() => {
            sessions[config.devices[device].id] = ssh;
        });
    }

    let send = data => {
        if (typeof data.update !== 'undefined' && typeof data.update.dv !== 'undefined') {
            let deviceName = $(data.update.s).attr('id'),
                session = sessions[deviceName],
                reconnectCount = 0;

            let isConnected = () => {
                session = sessions[deviceName];
                return new Promise((resolve, reject) => {
                    if (typeof session === 'undefined') {
                        reject();
                    } else {
                        resolve();
                    }
                });
            };

            let sendMessage = (data) => {
                isConnected().then(() => {
                    reconnectCount = 0;
                    if (typeof data.update.dv.css !== 'undefined') {

                        /*
                         * Set up what each CSS(D) property does
                         */
                        if (data.update.dv.css.volume !== 'undefined') {
                            let volume = data.update.dv.css.volume;

                            if (volume.indexOf('%') > -1) { //percentage format
                                volume = parseInt(volume.replace('%', ''));
                            } else if (!isNaN(parseFloat(volume)) && isFinite(volume)) {  //decimal format
                                volume *= 100;
                            }

                            if (volume < 0) volume = 0;
                            if (volume > 100) volume = 100;
                            session.execCommand(`osascript -e "set volume output volume ${volume} --100%"`);
                        }
                    }

                    /*
                     * Set up what each action does
                     */
                    if (data.update.dv.action !== 'undefined') {
                        if (data.update.dv.action === 'media.play') {
                            session.execCommand(`osascript -e 'tell application "${app}" to play'`);
                        } else if (data.update.dv.action === 'media.pause') {
                            session.execCommand(`osascript -e 'tell application "${app}" to pause'`);
                        } else if (data.update.dv.action === 'media.stop') {
                            session.execCommand(`osascript -e 'tell application "${app}" to stop'`);
                        } else if (data.update.dv.action === 'media.next') {
                            session.execCommand(`osascript -e 'tell application "${app}" to next track'`);
                        } else if (data.update.dv.action === 'media.prev') {
                            session.execCommand(`osascript -e 'tell application "${app}" to previous track'`);
                        }
                    }
                }, () => {
                    if (reconnectCount < 5) {
                        log.debug('Mac SSH: SSH not connected, reconnecting');
                        reconnectCount++;
                        for (let device in config.devices) {
                            if (config.devices[device].id === deviceName) {
                                let ssh = new node_ssh();
                                ssh.connect({
                                    host: config.devices[device].host,
                                    username: config.devices[device].username,
                                    privateKey: config.devices[device].privateKey
                                }).then(() => {
                                    sessions[deviceName] = ssh;
                                    isConnected();
                                });
                            }
                        }
                    } else {
                        log.error('Mac SSH: Cannot connect to ssh: ' + deviceName);
                    }
                });
            };

            sendMessage(data);
        }
    };

    device_bus.on(config.updateHandler, data => {
        log.debug('Mac SSH: received data: ' + JSON.stringify(data));
        send(data);
    });
};
