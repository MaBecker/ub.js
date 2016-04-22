/*jslint node: true*/
/**
 * A simple plugin
 * @module examples/simple_plugin
 *
 * This is a basic skeleton for a plugin
 *
 * @author Alex Owen
 */

'use strict';

/** Initialise the module
 *  @param config - configuration parameters
 */
exports.init = config => {

    // For convenience, give the global variables local representations.
    let bus = global.bus,
        log = global.log,
        helpers = global.helpers,
        $ = global.$,
        device_bus = global.device_bus;


    /* Create a dummy entry in the DOM
     *
     * This is required for the plugin to be able to send and receive messages.
     *
     * r: the request ID for the message, which allows tracing it through the
     *    system and will be the same as the response that comes background
     * o: the origin of the request, usually checked against the DOM, but not
     *    for a create message as the device is not in the DOM yet
     * dv: categorises the message as a device based message (as opposed to a
     *     channel or component message)
     * id: the id of the device being assed to the DOM, usually set in the
     *     config file
     *
     * helpers.idGen() creates a random five character ID
     *
     */
    bus.emit('create', {
        r: helpers.idGen(),
        o: config.id,
        dv: {
            id: config.id
        }
    });

    /* Register an update handler
     *
     * The update handler is used as the event type when the Hub sends a
     * message to the device_bus.
     *
     */
    bus.emit('register_update_handler', {
        simple_plugin: config.updateHandler
    });

    /* Register a termination handler
     *
     * This is called when the Node process is ended. It returns a promise and
     * the process will wait for this promise to be returned before it ends.
     *
     * Registering a termination handler is optional, only do it if you need
     * one.
     *
     */
    bus.emit('register_termination_handler', () => {
        return new Promise((resolve, reject) => {
            try {
                // do some cleanup tasks, close a database, etc.
                resolve();
            } catch (err) {
                reject();
            }
        });
    });

    /* Register any devices and thier components
     *
     * Assuming the devices connected aren't capable of registering themselves
     * with IDs and classes that are compatible, then this must be done
     * manually in some way.
     *
     * Some plugins (e.g. WebSockets and Serial) connect to devices capable of
     * registering themselves.
     *
     */
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

    /* A function which is called when a message is received
     *
     * This can be expanded to do just about anything.
     *
     */
    let proprietaryProtocol = {
        send: () => {},
        receive: () => {}
    };
    let receiveMessageFromHub = data => {
        if (typeof data.update !== 'undefined' && typeof data.update.dv !== 'undefined' && typeof data.update.dv.css !== 'undefined') {
            if (typeof data.update.dv.css.color !== 'undefined') {
                // convert the data to the proprietary format then transmit it
                proprietaryProtocol.send({
                    type: 'colorUpdate',
                    data: data.update.dv.css.color
                });
            }
        }
    };

    /* Receive a proprietary message, e.g. over serial, and forward it on to
     * the Hub
     *
     * This is an example and would need more error/null checking in a real
     * system.
     *
     */
    let sendMessageToHub = message => {
        if (message.type === 'create') {
            bus.emit('create', message.data);
        } else if (message.type === 'read') {
            bus.emit('read', message.data);
        } else if (message.type === 'update') {
            bus.emit('update', message.data);
        } else if (message.type === 'delete') {
            bus.emit('delete', message.data);
        }
    };
    proprietaryProtocol.receive('incomingMessage', sendMessageToHub);

    /* Register a listener for messages from the Hub (or any other part of the
     * system)
     *
     * The update handler is used here again.
     *
     * Note this only handles updates. Many events are handled directly by the
     * hub, e.g. read will read the DOM representation of the device, not the
     * device itself
     *
     */
    device_bus.on(config.updateHandler, data => {

        // Check that the data contains the correct fields

        if (typeof data.update !== 'undefined' && data.update.s !== 'undefined') {
            if ($(data.update.s).attr('id') === config.id) {
                log.debug('Simple Plugin: received data: ' + JSON.stringify(data));
                receiveMessageFromHub(data);
            }
        } else {
            log.error('Simple Plugin: something was wrong with the received data: ' + JSON.stringify(data));
        }
    });
};
