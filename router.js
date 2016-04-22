/*jslint node: true*/
/**
 * Router module
 * @module router
 *
 * This module connects devices and channels
 *
 * @author Alex Owen
 */

'use strict';

/** Initialise the module
 *  @param config - configuration parameters
 */
exports.init = config => {

    let bus = global.bus,
        device_bus = global.device_bus,
        log = global.log,
        $ = global.$,
        helpers = global.helpers,
        importedRules = ubRequire('router_rules.js').init();

    bus.emit('create', {
        r: helpers.idGen(),
        o: config.id,
        dv: {
            id: config.id,
            attr: {
                type: 'router'
            }
        }
    });

    //	register an update handler
    bus.emit('register_update_handler', {
        router: config.updateHandler
    });

    let rules = [];

    let addRule = (source, destination, transform) => {
            if (typeof source !== 'undefined' && typeof destination !== 'undefined' && typeof transform === 'function') {
                log.debug('Router: added rule.');
                let r = helpers.idGen();

                let callback = data => {
                    if (typeof data.response !== 'undefined' && data.response.r === r) {
                        rules.push({
                            source,
                            destination,
                            transform
                        });
                        bus.emit('update', {
                            r: helpers.idGen(),
                            o: config.id,
                            s: '#' + source,
                            ch: {
                                subscribers: '+#' + config.id
                            }
                        });
                        device_bus.removeListener(config.updateHandler, callback);
                    }
                };

                device_bus.on(config.updateHandler, callback);

                bus.emit('create', {
                    r,
                    o: config.id,
                    ch: {
                        id: source
                    }
                });
            } else {
                log.error('Router: failed to add rule.');
            }
        },
        removeRule = (source, destination) => {
            if (typeof source !== 'undefined' && typeof destination !== 'undefined') {
                let success = false;
                for (let i in rules) {
                    if (rules[i].source === source && rules[i].destination === destination) {
                        rules[i].splice(i, 1);
                        success = true;
                    }
                }
                if (!success) log.error(`Router: failed to remove rule with source ${source} and destination ${destination}`);
            } else {
                log.error('Router: failed to remove rule');
            }
        };

    for (let rule in importedRules) {
        addRule(importedRules[rule].source, importedRules[rule].destination, importedRules[rule].transformer);
    }

    device_bus.on(config.updateHandler, data => {
        if (typeof data.update !== 'undefined') {
            let sendUpdate = ($elem, i) => {
                let message = rules[i].transform(data.update);
                if (message !== undefined) {
                    message.r = helpers.idGen();
                    message.o = data.update.o;
                    message.s = '#' + $elem.attr('id');
                    bus.emit('update', message);
                }
            };
            for (let i in rules) {
                if (typeof rules[i].source !== 'undefined' && rules[i].source === data.update.ch && typeof rules[i].destination !== 'undefined' && typeof rules[i].transform === 'function') {
                    $(rules[i].destination).each(function() {
                        sendUpdate($(this), i);
                    });
                }
            }
        }

    });
};
