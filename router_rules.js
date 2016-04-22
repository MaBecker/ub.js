/*jslint node: true*/
'use strict';
exports.init = () => {
    let log = global.log;

    let rules = [

        // example rules
        /*
        {
            source: 'button',
            destination: '.floodlight',
            transformer: function(update) {
                if (typeof update === 'string') {
        			try {
        				update = JSON.parse(update);
        			} catch (e) {
        				log.error(e);
        			}
        		}

        		console.log(update);
        		if (typeof update.dv !== 'undefined' && typeof update.dv.d !== 'undefined' && typeof update.dv.d.color !== 'undefined') {
        			return {dv: {css: update.dv.d}};
        		}
            }
        },
        */

        /*
        {
            source: 'button',
            destination: '#desk_lamp',
            transformer: function(update) {
                if (typeof update === 'string') {
        			try {
        				update = JSON.parse(update);
        			} catch (e) {
        				log.error(e);
        			}
        		}
        		if (typeof update.dv !== 'undefined' && typeof update.dv.d !== 'undefined' && typeof update.dv.d.power !== 'undefined') {
        			return {dv: {css: update.dv.d}};
        		}
            }
        },
        */

        /*
        {
            source: 'environment',
            destination: '#DATABASE',
            transformer: function(update) {
                return update;
            }
        },
        */

        /*
        {
            source: 'environment',
            destination: '.screen',
            transformer: function(update) {
                if (typeof update === 'string') {
        			try {
        				update = JSON.parse(update);
        			} catch (e) {
        				log.error(e);
        			}
        		}

        		if (typeof update.dv !== 'undefined' && typeof update.dv.d !== 'undefined' && typeof update.dv.d.temperature !== 'undefined' && typeof update.dv.d.humidity !== 'undefined') {
        			return {dv: {css: {content: `Temp: ${update.dv.d.temperature}\nRH: ${update.dv.d.humidity}`}}};
        		}
            }
        },
        */

        /*
        {
            source: 'environment',
            destination: '.dehumidifier',
            transformer: function(update) {
                if (typeof update === 'string') {
                    try {
                        update = JSON.parse(update);
                    } catch (e) {
                        log.error(e);
                    }
                }

                if (typeof update.dv !== 'undefined' && typeof update.dv.d !== 'undefined' && typeof update.dv.d.humidity !== 'undefined') {
                    if (update.dv.d.humidity > 65) {
                        return {dv: {css: {power: 'on'}}};
                    } else if (update.dv.d.humidity <= 60) {
                        return {dv: {css: {power: 'off'}}};
                    }
                }
            }
        }
        */
    ];

    return rules;
};
