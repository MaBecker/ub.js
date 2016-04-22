/*jslint node: true */
/**
 * ub.js hub
 *
 * TODO: Implement a proper response architecture (half done)
 * TODO: Fetching of remote CSS files
 *
 * @author Alex Owen
 */

'use strict';

// Speed Test (used for debugging)
// Place p1 at the start and p2 at the end of a timing block

/*global.probes = {};
global.p1 = (label) => {
    global.probes[label] = process.hrtime();
};
global.p2 = (label) => {
    if (typeof global.probes[label] !== 'undefined') {
        let end = process.hrtime(global.probes[label]);
        console.log(`##### Probe: ${label}: ${end[0]}s ${end[1]/1000000}ms #####`);
    }
};*/

// Temporary Logging
let log = global.log = {};
log.debug = (text) => {
   console.log('Debug', text);
};
log.error = (text) => {
   console.log('Error', text);
};
log.fatal = (text) => {
   console.log('Fatal', text);
};

// Get the path to load plugins/virtual devices from

global.appPath = './';
if (typeof process.argv[2] !== 'undefined') {
    global.appPath = process.argv[2];
}

/*
 * ubRequire is used for separating apps into folders. It will take the first
 * argument from the command line/terminal (appPath) and use it as the base
 * folder for all Node module 'require's. It allows you to separate out and
 * organise different uses for ub.
 *
 */

let ubRequire = global.ubRequire = (path) => {
    try {
        return require(global.appPath + path);
    } catch (err) {
        log.debug('ubRequire: can\'t find: ' + global.appPath + path);
        try {
            return require('./' + path);
        } catch (err) {
            log.debug('ubRequire: can\'t find: ' + global.appPath + path);
            try {
                return require(path);
            } catch (err) {
                log.error('ubRequire failed: ' + path);
            }
        }
    }
};

// Required modules
let events = require('events'),
    fs = require('fs'),
    jsdom = require('jsdom');

let helpers = global.helpers = ubRequire('helpers.js');

// Config
let config = (function() {
    let data = {};
    try {
        data = JSON.parse(fs.readFileSync(global.appPath + 'config.json', 'utf8'));
    } catch (e) {
        log.error(e);
    }
    return data;
})();

log = global.log = require('log4js').getLogger('ub');
log.setLevel = "DEBUG";

// Events buses

let bus = global.bus = new events.EventEmitter();
let device_bus = global.device_bus = new events.EventEmitter();

// update handlers, stops duplication of costly DOM traversal by each plugin
let updateHandlers = {};
bus.on('register_update_handler', data => {
    for (let handler in data) {
        if (data.hasOwnProperty(handler)) {
            updateHandlers[handler] = data[handler];
        }
    }
});

// termination handlers, allows plugins to register functions to call on exit
let terminationHandlers = {};
bus.on('register_termination_handler', data => {
    let id = helpers.idGen();
    terminationHandlers[id] = data;
});

// CSS
// Array of selector/rule pairs
// {selector: '#example', properties: {background: 'orange', power: 'on'}}
// TODO: add a clean up function
// TODO: check existing rules when adding a new device

global.css = (() => {
    let rules = [],
        addRule = (rule) => {
            if (typeof rule.selector !== 'undefined' && typeof rule.properties !== 'undefined') {
                rules.push(rule);
            } else {
                log.error('CSS: invalid CSS rule');
            }
        },
        updateRule = (rule) => {
            if (typeof rule.selector !== 'undefined' && typeof rule.properties !== 'undefined') {
                let matched = false;
                for (let i in rules) {
                    if (rules[i].selector === rule.selector) {
                        matched = true;
                        for (let property in rule.properties) {
                            if (rule.properties.hasOwnProperty(property)) {
                                rules[i].properties[property] = rule.properties[property];
                            }
                        }
                    }
                }
                if (!matched) {
                    rules.push(rule);
                }
            } else {
                log.error('CSS: invalid CSS rule');
            }
        },
        removeRule = (position) => {

        },
        reorderRule = (oldPosition, newPosition) => {

        },
        replaceRules = (rules) => {
            //TODO: check validity
        },
        getRules = () => {
            return rules;
        };

    return {
        addRule,
        updateRule,
        rules: getRules()
    };
})();

// DOM

/**
 * Set up a DOM to contain the pub/sub channels and the devices attached to this hub
 * Also, import jQuery for traversing/manipulating/filtering the DOM.
 * @return global.$ - a jQuery object containing a reference to the DOM
 */
let $ = {};
jsdom.env(
    `<hub><context id="${config.hub.contextID}" class="${config.hub.contextClass}"></context><channels></channels></hub>`, [__dirname + '/lib/jquery.js'],
    (errors, window) => {
        if (errors) {
            log.error('DOM: ' + errors);
        }

        $ = global.$ = window.$;
        $.validProperties = config.cssProperties;

        if (typeof($) !== 'undefined') {
            bus.emit('DOM.ready');
        } else {
            log.error('DOM: jQuery could not be initialised.');
        }
    }
);

bus.on('DOM.ready', () => {
    let id = config.hub.id,
        isValidRequest = data => { // checks the request for a valid request ID and a valid origin
            if (!data.r || data.r.length !== 5) return false;
            if (!data.o) return false;
            if (!isValidID(data.o)) return false;
            return true;
        },
        isValidID = id => { // checks that an ID doesn't have illegal characters in it
            if (typeof id === 'undefined') return false;
            return /^[a-zA-Z][\w:.-]*$/.test(id);
        },
        isValidSelector = selector => { // checks that a selector selects something in the DOM
            let valid = false;
            try {
                if ($(selector).length > 0) {
                    valid = true;
                }
            } catch (e) {
                log.error(e);
                valid = false;
            }
            return valid;
        },
        success = (t, data) => {
            // respond to requestor
            if ('#' + data.o !== data.s) {
                bus.emit('response', {
                    r: data.r,
                    o: id,
                    s: '#' + data.o,
                    t,
                    st: 1,
                    d: data.d
                });

                // forward message to device(s)
                if (typeof data.dv !== 'undefined') {
                    let $device = $(data.s);
                    $device.each(function() {
                        let dataTemp = data;
                        dataTemp.s = '#' + $(this).attr('id');
                        log.debug(`Success: Forwarding update to device ${dataTemp.s}: ${JSON.stringify(dataTemp)}`);
                        emitUpdate($(this), dataTemp);
                    });
                } else if (data.t === 'create' || data.t === 'read' || data.t === 'update' || data.t === 'delete') {
                    let $device = $(data.s);
                    $device.each(function() {
                        let dataTemp = data;
                        dataTemp.s = '#' + $(this).attr('id');
                        log.debug(`Success: Forwarding response to device ${dataTemp.s}: ${JSON.stringify(dataTemp)}`);
                        emitResponse($(this), dataTemp);
                    });
                }
            }
        },
        error = (t, r, o, s, m) => {
            log.error(`Error: ${t}: ${m}, ${o}`);
            if (t !== 'response') {
                bus.emit('response', {
                    r: r,
                    o: o,
                    s,
                    st: 0, // error
                    m,
                    t
                });
            }
        },
        emitUpdate = ($device, data) => {
            for (let prop in updateHandlers) {
                if (prop === $device.attr('type') || prop === $device.closest('device').attr('type')) {
                    if (updateHandlers.hasOwnProperty(prop)) {
                        device_bus.emit(updateHandlers[prop], {
                            update: data
                        });
                    }
                }
            }
        },
        emitResponse = ($device, data) => {
            for (let prop in updateHandlers) {
                if (prop === $device.attr('type') || prop === $device.closest('device').attr('type')) {
                    if (updateHandlers.hasOwnProperty(prop)) {
                        device_bus.emit(updateHandlers[prop], {
                            response: data
                        });
                    }
                }
            }
        };

    // Using this you can specify a callback to be executed once a response with a certain ID is received.
    // Pending requests can be have a timeout, in which case they will be removed and the callback associated with them will not be called.
    // Notes:
    // - This does not check whether the callback exists when adding it
    // - Only one callback can be added per request ID
    // - Timeout is untested
    class Requests {
        constructor() {
            this.requests = {};
        }

        add(id, callback, timeout) {
            this.requests[id] = {
                callback
            };
            if (typeof timeout !== 'undefined') {
                this.requests[id].timeout = setTimeout(() => {
                    this.remove(id);
                    //send failure
                }, timeout);
            }
        }

        remove(id) {
            if (typeof this.requests[id] !== 'undefined') {
                if (typeof this.requests[id].timeout !== 'undefined') {
                    clearTimeout(this.requests[id].timeout);
                }
                this.requests[id] = undefined;
            }
        }

        getRequest(id) {
            return this.requests[id];
        }
    }

    let pendingRequests = new Requests();

    bus.on('create', data => {
        log.debug(`Create: received: ${JSON.stringify(data)}`);
        if (isValidRequest(data)) { //check the data format
            if (typeof data.dv !== 'undefined') { //create a device
                //if the ID is valid and if a device with this ID doesn't exist, create it, if it does exist, remove it and add the new one
                if (isValidID(data.dv.id)) { //check the id is valid according to HTML spec
                    if ($('context').find('#' + data.dv.id).length) $('context').find('#' + data.dv.id).remove();
                    let classString = '';
                    if (typeof data.dv.class !== 'undefined') {
                        classString = ` class="${data.dv.class}"`;
                    }
                    $('context').append(`<device id="${data.dv.id}"${classString}/>`);
                    if (typeof data.dv.attr !== 'undefined') $('#' + data.dv.id).attr(data.dv.attr);
                    log.debug(`Create: added device: ${$('#' + data.dv.id).clone().wrap('<div>').parent().html()}`);
                    success('create', data);
                    //}
                } else {
                    error('create', data.r, id, '#' + data.o, `The specified ID (${data.dv.id}) is not valid.`);
                }
            } else if (typeof data.cm !== 'undefined') { //create a component (always replace existing components)
                if (typeof data.cm.p !== 'undefined') { //check the id is valid according to HTML spec
                    $('context #' + data.cm.id).remove();
                    let classString = '';
                    if (typeof data.cm.class !== 'undefined') {
                        classString = ` class="${data.cm.class}"`;
                    }
                    $('context #' + data.cm.p).append(`<component id="${data.cm.id}"${classString}/>`);
                    if (typeof data.cm.attr !== 'undefined') $('#' + data.cm.id).attr(data.cm.attr);
                    log.debug(`Create: added component to ${data.cm.p}: ${$('context #' + data.cm.id).clone().wrap('<div>').parent().html()}`);
                    success('create', data);
                } else {
                    error('create', data.r, id, '#' + data.o, `No parent is specified for component: ${data}`);
                }
            } else if (typeof data.ch !== 'undefined') { //create a channel
                //if the ID is valid and if a channel with this ID doesn't exist, create it
                if (isValidID(data.ch.id)) { //check the id is valid according to HTML spec
                    if (!$('channels').find('#' + data.ch.id).length) {
                        $('channels').find(data.ch.id).remove();
                        if (typeof data.ch.class === 'undefined') data.ch.class = '';
                        $('channels').append(`<channel id="${data.ch.id}" class="${data.ch.class}"/>`);
                        $('channels').find('#' + data.ch.id).prop('subscribers', []);
                        if (typeof data.ch.attr !== 'undefined') $('#' + data.ch.id).attr(data.ch.attr);
                        log.debug(`Create: added channel: ${$('#' + data.ch.id).clone().wrap('<div>').parent().html()}`);
                        success('create', data);
                    } else { // TODO: remove/change this?
                        error('create', data.r, id, '#' + data.o, `Channel already exists with ID ${data.ch.id}`);
                    }
                } else {
                    error('create', data.r, id, '#' + data.o, `The specified ID (${data.ch.id}) is not valid.`);
                }
            } else { //unknown create, error
                error('create', data.r, id, '#' + data.o, `Unknown type of create received: ${data.r}`); //this is not a device or channel create
            }
        } else { //the data format is incorrect according to isValidRequest()
            error('create', data.r, id, '#' + data.o, `Invalid data received in create request: ${data.r}`); //the request was not correctly formed
        }
    });

    bus.on('read', data => {
        log.debug(`Read: received: ${JSON.stringify(data)}`);
        if (isValidRequest(data) && $('#' + data.o).length) {
            let readItem = data => {
                if (isValidSelector(data.s)) {
                    data.d = '';
                    if ($(data.s).length > 0) { // if something matches the selector
                        $(data.s).each(function() { //for each match, extract just that element, without children
                            let elem = $(this).html('').clone().wrap('<div>').parent();
                            data.d += elem.html();
                        });
                        data.dv = undefined;
                        success('read', data);
                    } else {
                        error('read', data.r, id, '#' + data.o, `Selector (${data.s}) did not return any elements: ${data.r}`); //no elements matched by the selector
                    }
                } else {
                    error('read', data.r, id, '#' + data.o, `Error in selector (${data.s}): ${data.r}`); //the selector was incorrect
                }
            },

            readCSS = data => {
                if (isValidSelector(data.s)) {
                    data.d = '';
                    if ($(data.s).length > 0) { // if something matches the selector
                        if ($(data.s).length > 1) {
                            data.d = [];
                            $(data.s).each(function() { //for each match, add the result to an array
                                let value = $(this).css(data.dv.css);
                                if (typeof value !== 'undefined') {
                                    data.d.push(value);
                                }
                            });
                        } else {
                            data.d = $(data.s).css(data.dv.css);
                        }
                        data.dv = undefined;
                        success('read', data);
                    } else {
                        error('read', data.r, id, '#' + data.o, `Selector (${data.s}) did not return any elements: ${data.r}`); //no elements matched by the selector
                    }
                } else {
                    error('read', data.r, id, '#' + data.o, `Error in selector (${data.s}): ${data.r}`); //the selector was incorrect
                }
            };

            if (typeof data.ch !== 'undefined') { //a channel
                let s = '';
                data.s.split(',').forEach(function(e, i, arr) {
                    s += 'channels ' + arr[i];
                    if (typeof arr[i + 1] !== 'undefined') s += ',';
                });
                data.s = s;
                readItem(data);
            } else if (typeof data.dv !== 'undefined') { //a device
                let s = '';
                data.s.split(',').forEach(function(e, i, arr) {
                    s += 'context ' + arr[i];
                    if (typeof arr[i + 1] !== 'undefined') s += ',';
                });
                data.s = s;
                if (typeof data.dv.css === 'string') {
                    readCSS(data);
                } else {
                    readItem(data);
                }
            } else {
                error('read', data.r, id, '#' + data.o, `Unknown type of read received: ${data.r}, ${data.t}`);
            }
        } else {
            error('read', data.r, id, '#' + data.o, `Invalid data received in read request: ${data.r}`); //the request was not correctly formed
        }
    });

    bus.on('update', data => {
        log.debug(`Update: received: ${JSON.stringify(data)}`);
        if (isValidRequest(data) && $('#' + data.o).length) {
            if (isValidSelector(data.s)) {
                if (typeof data.dv !== 'undefined') { //update a device or component
                    log.debug(`Update: Update device(s): ${data.s}`);
                    let s = '';
                    data.s.split(',').forEach(function(e, i, arr) {
                        s += 'context ' + arr[i];
                        if (typeof arr[i + 1] !== 'undefined') s += ',';
                    });
                    data.s = s;
                    if ($(data.s).length > 0) {
                        let err = false;
                        if (typeof data.dv.css !== 'undefined') {
                            if (typeof data.dv.css === 'object') {
                                log.debug(`Update: CSS ${JSON.stringify(data.dv.css)} on ${data.s}`);
                                try {
                                    $(data.s).css(data.dv.css);
                                    let properties = {};
                                    for (let key in data.dv.css) {
                                        if (data.dv.css.hasOwnProperty(key) && $.isValidProperty(key)) {
                                            properties[key] = data.dv.css[key];
                                        }
                                    }
                                    global.css.updateRule({
                                        selector: data.s,
                                        properties
                                    });
                                } catch (e) {
                                    log.error(e);
                                    err = true;
                                    error('update', data.r, id, '#' + data.o, `Update: Failed to update CSS on at least one in ${data.s}: ${data.r}`);
                                }
                            }
                            else {
                                error('update', data.r, id, '#' + data.o, `CSS type was not recognised (${data.dv.css}): ${data.r}`);
                            }
                        }
                        if (typeof data.dv.class !== 'undefined') {
                            pendingRequests.add(data.r, updateClass);
                        }
                        if (typeof data.dv.id !== 'undefined') {
                            pendingRequests.add(data.r, updateID);
                        }
                        if (!err) {
                            log.debug('Update: device update success');
                            success('update', data);
                        } else {
                            log.debug('Update: device update error');
                            error('update', data.r, id, '#' + data.o);
                        }
                    } else {
                        error('update', data.r, id, '#' + data.o, `Selector (${data.s}) did not match any devices: ${data.r}`); //no elements matched by the selector
                    }
                } else if (typeof data.ch !== 'undefined') { //update a channel, must be 'else' and in this order for channel data publish (has dv and ch)
                    log.debug('Update: Channel');
                    let s = '';
                    data.s.split(',').forEach(function(e, i, arr) {
                        s += 'channels ' + arr[i];
                        if (typeof arr[i + 1] !== 'undefined') s += ',';
                    });
                    data.s = s;
                    if ($(data.s).length > 0) {
                        let err = false;
                        if (typeof data.ch.class !== 'undefined') {
                            if (data.ch.class[0] === '+') { //add a class/classes
                                $(data.s).addClass(data.ch.class.substring(1));
                            } else if (data.ch.class[0] === '-') { //remove a class/classes
                                $(data.s).removeClass(data.ch.class.substring(1));
                            } else { //replace the class(es)
                                $(data.s).removeClass().addClass(data.ch.class);
                            }
                        }

                        if (typeof data.ch.subscribers !== 'undefined') {
                            let subscribers = data.ch.subscribers.split(/,/);
                            $(data.s).each(function() {
                                let $elem = $(this);
                                subscribers.forEach(selector => {
                                    if (selector[0] === '+') { //add a subscriber/subscribers
                                        if (typeof $elem.prop('subscribers') === 'undefined') {
                                            $elem.prop('subscribers', []);
                                        }
                                        $(selector.substring(1)).each(function() {
                                            var devId = $(this).attr('id');
                                            if ($elem.prop('subscribers').indexOf(devId) === -1) {
                                                $elem.prop('subscribers').push(devId);
                                                log.debug('Update: Channel: added subscriber: ' + devId);
                                            }
                                            if (typeof $elem.prop('lastDatum') !== 'undefined') {
                                                var message = {
                                                    r: helpers.idGen(),
                                                    o: '#' + id,
                                                    s: '#' + devId,
                                                    dv: {
                                                        d: $elem.prop('lastDatum')
                                                    },
                                                    ch: $elem.attr('id')
                                                };
                                                emitUpdate($(this), message);
                                            }
                                        });
                                    } else if (selector[0] === '-') { //remove a subscriber/subscribers
                                        if (typeof $elem.prop('subscribers') !== 'undefined') {
                                            $(selector.substring(1)).each(function() {
                                                var id = $(this).attr('id');
                                                var index = $elem.prop('subscribers').indexOf(id);
                                                if (index > -1) {
                                                    $elem.prop('subscribers').splice(index, 1);
                                                    log.debug('Update: Channel: removed subscriber: ' + id);
                                                }
                                            });
                                            if (subscribers.length === 0) {
                                                $elem.removeAttr('subscribers');
                                            }
                                        }
                                    } else { //replace subscribers
                                        $elem.prop('subscribers', subscribers);
                                        log.debug('Update: Channel: replaced subscriber: ' + subscribers);
                                    }
                                });
                            });
                        }

                        if (typeof data.ch.d !== 'undefined') { //publish data to the channel
                            log.debug('Update: Channel: publish');
                            $(data.s).each(function() {
                                $(this).prop('lastDatum', data.ch.d);
                                let subscribers = $(this).prop('subscribers');
                                if (typeof subscribers !== 'undefined') {
                                    subscribers.forEach(subscriber => { //for each subscriber, forward the message
                                        let $subscriber = $('#' + subscriber),
                                            message = {
                                                r: data.r,
                                                o: data.o,
                                                s: '#' + subscriber,
                                                dv: {
                                                    d: data.ch.d
                                                },
                                                ch: $(this).attr('id')
                                            };

                                        emitUpdate($subscriber, message);

                                        log.debug(`Update: Channel: Publish data to ${subscriber}: ${JSON.stringify(message)}`);
                                    });
                                } else {
                                    err = true;
                                }
                            });
                        }

                        if (!err) {
                            success('update', data);
                        } else {
                            log.debug('Update: channel update error');
                            error('update', data.r, id, '#' + data.o);
                        }
                    } else {
                        error('update', data.r, id, '#' + data.o, `Selector (${data.s}) did not match any channels: ${data.r}`); //no elements matched by the selector
                    }
                } else { //unknown update, error
                    error('update', data.r, id, '#' + data.o, `Unknown type of update received: ${data.r}`); //this is not a device or channel update
                }
            } else {
                error('update', data.r, id, '#' + data.o, `Error in selector (${data.s}): ${data.r}`); //the selector was incorrect
            }
        } else {
            error('update', data.r, id, '#' + data.o, `Invalid data received in request: ${data.r}`); //the request was not correctly formed
        }
    });

    bus.on('delete', data => {
        log.debug(`Delete: received: ${JSON.stringify(data)}`);
        if (isValidRequest(data)) {
            if (isValidSelector(data.s)) {
                if (typeof data.dv !== 'undefined') { //delete a device (or component)
                    if ($('context').find(data.s).length) {
                        $('context').find(data.s).remove();
                        log.debug('Delete: device removed: ' + data.s);
                        success('delete', data);
                    } else {
                        error('delete', data.r, id, '#' + data.o, `Delete failed, device does not exist (${data.s}): ${data.r}`); //the selector was incorrect
                    }
                } else if (typeof data.ch !== 'undefined') { //delete a channel
                    log.debug('Delete channel');
                    if ($('channels').find(data.s).length) {
                        $('channels').find(data.s).remove();
                        log.debug('Delete: channel removed: ' + data.s);
                        success('delete', data);
                    } else {
                        error('delete', data.r, id, '#' + data.o `Delete failed, channel does not exist (${data.s}): ${data.r}`); //the selector was incorrect
                    }
                }
            } else {
                error('delete', data.r, id, '#' + data.o, `Error in selector (${data.s}): ${data.r}`); //the selector was incorrect
            }
        } else {
            error('delete', data.r, id, '#' + data.o, `Invalid data received in delete request: ${data.r}`); //the request was not correctly formed
        }
    });

    bus.on('response', data => {
        if ((isValidRequest(data) || data.st === 0) && isValidSelector('#' + data.o)) { //a response should only go to one device
            if (isValidSelector(data.s)) {
                if (typeof pendingRequests.getRequest(data.r) !== 'undefined' && typeof pendingRequests.getRequest(data.r).callback !== 'undefined') {
                    pendingRequests.getRequest(data.r).callback(data);
                }
                success('response', data);
            } else {
                error('response', data.r, id, '#' + data.o, `Error in selector (${data.s}): ${data.r}`); //the selector was incorrect
            }
        } else {
            error('response', data.r, id, '#' + data.o, `Invalid data received in response request: ${data.r}`); //the request was not correctly formed
        }
    });

    // Response handlers
    let updateID = data => {
        if (data.st === 1) {
            $('#' + data.o).attr('id', data.dv.id);
        }
        pendingRequests.remove(data.r);
    };

    let updateClass = data => {
        if (data.st === 1) {
            if (data.dv.class[0] === '+') { //add a class/classes
                $('#' + data.o).addClass(data.dv.class.substring(1));
            } else if (data.dv.class[0] === '-') { //remove a class/classes
                $('#' + data.o).removeClass(data.dv.class.substring(1));
            } else { //replace the class(es)
                try {
                    $('#' + data.o).removeClass().addClass(data.dv.class);
                } catch (e) {
                    log.error(e);
                    error = true;
                    error('update', data.r, id, '#' + data.o, `Failed to add class to ${data.s}: ${data.r}`);
                }
            }
        }
        pendingRequests.remove(data.r);
    };

    // End Response Handlers

    // create a virtual device for the hub so it can send messages without validation failing
    bus.emit('create', {
        r: helpers.idGen(),
        o: id,
        dv: {
            id
        }
    });

    // require('./tests.js').init();	// Run tests
    ubRequire('css_properties.js').init(config.cssProperties); // initialise any custom CSS properties
    ubRequire('jquery_plugins.js').init(); // initialise any custom JQuery plugins

    let modules = {};
    for (let mod in config.modules) {
        if (config.modules.hasOwnProperty(mod)) {
            let params = {};
            if (typeof config.modules[mod].params !== 'undefined') {
                for (let param in config.modules[mod].params) {
                    if (config.modules[mod].params.hasOwnProperty(param)) {
                        params[param] = modules[config.modules[mod].params[param]];
                    }
                }
            }
            log.debug(`Broker: Loading module: ${config.modules[mod].file}`);
            modules[mod] = ubRequire(config.modules[mod].file).init(config.modules[mod].config, params);
        }
    }
});

// Keep the program running until it is terminated
process.on('uncaughtException', err => {
    log.error(err.stack);
    log.debug('Recovered from potentially critical error.');
});

process.on('SIGINT', () => {
    let promiseArray = [];

    for (let handler in terminationHandlers) {
        promiseArray.push(terminationHandlers[handler]());
    }

    Promise.all(promiseArray).then(() => {
        process.exit();
    });
});
