/**
 * ub Web Client
 *
 * Limitations:
 *
 * TODO: queue commands until the server is ready
 * TODO: allow setting of root node (default: document)
 *
 * @author Alex Owen
 */

(function() {
	var persistence = true,

	ub = function(selector) {
		return new ubFunc(selector);
	},

	d = [
		'create',
		'read',
		'delete',
		'update'
	],

	ubFunc = function(selector) {

		if (typeof ubFunc.id === 'undefined') {
			if (persistence) {
				if (typeof localStorage.id !== 'undefined') {
					ubFunc.id = localStorage.id;
				} else {
					ubFunc.id = 'WEB' + Math.floor(Math.random()*(1000+1));
					localStorage.id = ubFunc.id;
				}
			} else {
				ubFunc.id = 'WEB' + Math.floor(Math.random()*(1000+1));
			}
		}

		if (typeof selector !== 'undefined') {
			ubFunc.selector = selector;
		} else {
			ubFunc.selector = '#' + ubFunc.id;
		}

		if (typeof ubFunc.socket === 'undefined') {
			ubFunc.socket = io();

			//a hub or device has requested an action is performed
			ubFunc.socket.on('update', function(data) {
		        ubFunc.parse('update', data);
		    });

			ubFunc.socket.on('response', function(data) {
		        ubFunc.parse('response', data);
		    });

    		//a hub has requested info about the client
		    ubFunc.socket.on('read', function(data) {
		    	if (typeof data !== 'undefined' && data.t === 'discover') {

			    	var response = {
			    		r: data.r,
			    		o: ubFunc.id,
			    		st: 1,
			    		t: 'discover',
			    		dv: {
				    		id: ubFunc.id,
				    		class: 'web_ui'
			    		}
			    	};
					ubFunc.send('response', response);
				}
                document.dispatchEvent(new CustomEvent('ub:connect'));
		    });
		}

		if (typeof ubFunc.id_gen === 'undefined') {
			ubFunc.id_gen = function() {
				return (Math.random().toString(36) + '00000000000000000').slice(2, 7);
			};
		}

		if (typeof ubFunc.parse === 'undefined') {
			ubFunc.parse = function(event_type, message) {
				console.log (event_type, message);
				if (event_type === 'update' || event_type === 'response') {
					var data = JSON.parse(message),
						elem = document;

			        var new_event = new CustomEvent(event_type, {'detail': message});
		        	elem.dispatchEvent(new_event);
		        }
			};
		}

		if (typeof ubFunc.send === 'undefined') {
			ubFunc.send = function(message_type, data) {
				if (typeof message_type === 'undefined') {
					message_type = 'undefined';
				} else {
					if (typeof data.r === 'undefined') data.r = ubFunc.id_gen();
					if (typeof data.o === 'undefined') data.o = ubFunc.id;
					console.log('Send:', message_type, data);
					ubFunc.socket.emit(message_type, data);
				}
			};
		}

		return this;
	};

	ub.fn = ubFunc.prototype = {
		//send a css request to devices that match the selector
		css: function(property, value) {
            var css = {},
                r = ubFunc.id_gen();
            if (typeof value !== 'undefined') {
                return new Promise(function(resolve, reject) {
                    css[property] = value;
                    var handleResponse = function(e) {
                        var data = {};
                        try {
                            data = JSON.parse(e.detail);
                        } catch (err) {}
                        if (typeof data.r !== undefined && data.r === r) {
                            document.removeEventListener('response', handleResponse);
                            resolve();
                        }
                    };
                    document.addEventListener('response', handleResponse);

        			ubFunc.send('update', {
        				s: ubFunc.selector,
                        r: r,
        				dv: {
        					css: css
        				}
        			});
                });
            } else if (typeof property === 'object') {
                return new Promise(function(resolve, reject) {
                    css = property;
                    var handleResponse = function(e) {
                        var data = {};
                        try {
                            data = JSON.parse(e.detail);
                        } catch (err) {}
                        if (typeof data.r !== undefined && data.r === r) {
                            document.removeEventListener('response', handleResponse);
                            resolve();
                        }
                    };
                    document.addEventListener('response', handleResponse);

        			ubFunc.send('update', {
        				s: ubFunc.selector,
                        r: r,
        				dv: {
        					css: css
        				}
        			});
                });
            } else {
                return new Promise(function(resolve, reject) {
                    var handleResponse = function(e) {
                        var data = {};
                        try {
                            data = JSON.parse(e.detail);
                        } catch (err) {}
                        if (typeof data.r !== undefined && data.r === r) {
                            var value;
                            if (typeof data.d !== 'undefined') {
                                resolve(data.d);
                            } else {
                                resolve();
                            }
                            document.removeEventListener('response', handleResponse);
                        }
                    };
                    document.addEventListener('response', handleResponse);

        			ubFunc.send('read', {
        				s: ubFunc.selector,
                        r: r,
                        dv: {
                            css: property
                        }
        			});
                });
            }
		},
		cssSheet: function(url) {
			ubFunc.send('update', {
				s: ubFunc.selector,
				dv: {
					css: url
				}
			});
			return this;
		},
		//send an action request to devices that match the selector
		action: function(action) {
            return new Promise(function(resolve, reject) {
                var r = ubFunc.id_gen();
                var handleResponse = function(e) {
                    var data = {};
                    try {
                        data = JSON.parse(e.detail);
                    } catch (err) {}
                    if (typeof data.r !== undefined && data.r === r) {
                        document.removeEventListener('response', handleResponse);
                        resolve();
                    }
                };
                document.addEventListener('response', handleResponse);

                ubFunc.send('update', {
                    s: ubFunc.selector,
                    r: r,
                    dv: {
                        action: action
                    }
                });
            });
        },
        readDevice: function() {
            ubFunc.send('read', {
                s: ubFunc.selector,
                dv: {}
            });
        },
        readChannel: function() {
            ubFunc.send('read', {
                s: ubFunc.selector,
                ch: {}
            });
        },
		//subscribe to channels that match the selector
		sub: function() {
			ubFunc.send('update', {
				s: ubFunc.selector,
				ch: {
					subscribers: '+#' + ubFunc.id
				}
			});
			return this;
		},
		//unsubscribe from channels that match the selector
		unsub: function() {
			ubFunc.send('update', {
				s: ubFunc.selector,
				ch: {
					subscribers: '-#' + ubFunc.id
				}
			});
			return this;
		},
		//publish data to this device's channel
		pub: function(key, value) {
			var data = {};
			data[key] = value;
			ubFunc.send('update', {
				s: ubFunc.selector,
				ch: {
					d: data
				}
			});
			return this;
		},
        createDevice: function(id, classString, attr) {
            ubFunc.send('create', {
				dv: {
					id: id,
					class: classString,
                    attr: attr
				}
			});
			return this;
        },
        createComponent: function(parent, id, classString, attr) {
            ubFunc.send('create', {
				cm: {
                    p: parent,
					id: id,
					class: classString,
                    attr: attr
				}
			});
			return this;
        },
		//create a new channel on the hub
		createChannel: function(id, classString) {
			ubFunc.send('create', {
				ch: {
					id: id,
					class: classString
				}
			});
			return this;
		},
		//destroy any matching channels on the hub
		destroyChannel: function() {
			ubFunc.send('delete', {
				s: ubFunc.selector,
				ch: {}
			});
			return this;
		},
		test: function(type, obj) {
			ubFunc.send(type, obj);
			return this;
		},
		updateID: function(newID) {
			ubFunc.send('update', {
				s: ubFunc.selector,
				dv: {
					id: newID
				}
			});
			return this;
		},
		updateClass: function(newClass) {
			ubFunc.send('update', {
				s: ubFunc.selector,
				dv: {
					class: newClass
				}
			});
			return this;
		}
	};

	if (!window.ub) window.ub = ub;
})();
