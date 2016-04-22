/*jslint node: true*/
/**
 * A simple virtual device
 * @module examples/simple_virtual_device
 *
 * This is a basic skeleton for a virtual device
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


    /* Create the virtual device in the DOM
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
     * The update handler is used as the event type when the Hub sends a message
     * to the device_bus.
     *
     */
	bus.emit('register_update_handler', {simple_virtual_device: config.updateHandler});


    /* Register a termination handler
     *
     * This is called when the Node process is ended. It returns a promise and
     * the process will wait for this promise to be returned before it ends.
     *
     * Registering a termination handler is optional, only do it if you need *
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

    /* A function which is called when a message is received
     *
     * This can be expanded to do just about anything.
     *
     */
    let doSomething = data => {
        if (typeof data.update !== 'undefined' && typeof data.update.dv !== 'undefined' && typeof data.update.dv.css !== 'undefined') {
            if (typeof data.update.dv.css.color !== 'undefined') {
                log.debug('Simple Virtual Device: Changing the color to ' + data.update.dv.css.color);
            }
        }
    };

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
                log.debug('Simple Virtual Device: received data: ' + JSON.stringify(data));
                doSomething(data);
            }
        } else {
            log.error('Simple Virtual Device: something was wrong with the received data: ' + JSON.stringify(data));
        }
    });
};
