/*jslint node: true */
/**
 * Virtual device module
 * @module socket
 *
 * This module stores virtual devices
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
        vHelpers = global.ubRequire('virtual_device_helpers.js');

    bus.emit('create', {
        r: helpers.idGen(),
        o: config.id,
        dv: {
            id: config.id,
            attr: {
                type: 'virtual_device_manager'
            }
        }
    });

    // Thermostat Example

    class Thermostat {
        constructor(minTemp, maxTemp) {
            this._temperatureMin = Number(minTemp);
            this._temperatureMax = Number(maxTemp);
            this._temperature = null;
        }
        get temperatureMin() {
            return this._temperatureMin;
        }
        set temperatureMin(temp) {
            temp = Number(temp);
            this._temperatureMin = temp;
        }
        get temperatureMax() {
            return this._temperatureMax;
        }
        set temperatureMax(temp) {
            temp = Number(temp);
            this._temperatureMax = temp;
        }
        get temperature() {
            return this._temperature;
        }
        set temperature(temp) {
            temp = Number(temp);
            this._temperature = temp;
        }
    }

    let createThermostat = (id, className, channel, type) => {
        let thermostat = new Thermostat('0', '-1');

        className = typeof className !== 'undefined' ? className : '';

        bus.emit('register_update_handler', {
            [type]: type
        });

        let testTemps = temp => {
            temp = (temp + '');
            if (thermostat.temperatureMin > thermostat.temperatureMax) {
                log.debug(`Thermostat: Turn off heater: temperatureMin greater than temperatureMax`);
                vHelpers.sendUpdate(id, '.heater', {
                    dv: {
                        css: {
                            power: 'off'
                        }
                    }
                }, type);
            } else if (temp && temp <= thermostat.temperatureMin) {
                log.debug(`Thermostat: Turn on heater: ${temp} <= ${thermostat.temperatureMin}`);
                vHelpers.sendUpdate(id, '.convection_heater', {
                    dv: {
                        css: {
                            power: 'on'
                        }
                    }
                }, type);
            } else if (temp && temp >= thermostat.temperatureMax) {
                log.debug(`Thermostat: Turn off heater: ${temp} >= ${thermostat.temperatureMax}`);
                vHelpers.sendUpdate(id, '.heater', {
                    dv: {
                        css: {
                            power: 'off'
                        }
                    }
                }, type);
            }
        };

        let addListener = () => {
            device_bus.on(type, data => {
                if (typeof data.update !== 'undefined' && typeof data.update.dv !== 'undefined') {
                    if (typeof data.update.dv.css !== 'undefined') {
                        if (typeof data.update.dv.css.temperatureMax !== 'undefined') {
                            thermostat.temperatureMax = (data.update.dv.css.temperatureMax + '').replace(/c/gi, '');
                            testTemps(thermostat.temperature);
                        }

                        if (typeof data.update.dv.css.temperatureMin !== 'undefined') {
                            thermostat.temperatureMin = (data.update.dv.css.temperatureMin + '').replace(/c/gi, '');
                            testTemps(thermostat.temperature);
                        }
                    } else if (typeof data.update.dv.d !== 'undefined' && typeof data.update.dv.d.temperature !== 'undefined') {
                        vHelpers.sendUpdate(id, '#' + id, {
                            dv: {
                                css: {
                                    temperature: data.update.dv.d.temperature + 'c'
                                }
                            }
                        }, type);
                        thermostat.temperature = (data.update.dv.d.temperature + '').replace(/c/gi, '');
                        testTemps(data.update.dv.d.temperature);
                    }
                }
            });
        };
        testTemps();
        vHelpers.createDevice(id, className, type).then(() => {
            return vHelpers.sendUpdate(id, '#' + id, {
                dv: {
                    css: {
                        temperatureMin: thermostat.temperatureMin + 'c',
                        temperatureMax: thermostat.temperatureMax + 'c'
                    }
                }
            }, type);
        }).then(() => {
            return vHelpers.createChannel(channel, id, type);
        }).then(() => {
            return vHelpers.subscribeToChannel(channel, id, type);
        }).then(addListener);
    };

    createThermostat('thermostat', undefined, 'environment', 'virtual.thermostat');


    // Humidity Controller example


    class HumidityController {
        constructor(minRH, maxRH) {
            this._humidityMin = Number(minRH);
            this._humidityMax = Number(maxRH);
            this._humidity = null;
        }
        get humidityMin() {
            return this._humidityMin;
        }
        set humidityMin(rh) {
            rh = Number(rh);
            if (rh < 0) rh = 0;
            if (rh > 100) rh = 100;
            this._humidityMin = rh;
        }
        get humidityMax() {
            return this._humidityMax;
        }
        set humidityMax(rh) {
            rh = Number(rh);
            if (rh < 0) rh = 0;
            if (rh > 100) rh = 100;
            this._humidityMax = rh;
        }
        get humidity() {
            return this._humidity;
        }
        set humidity(rh) {
            rh = Number(rh);
            this._humidity = rh;
        }
    }

    let createHumidityController = (id, className, channel, type) => {
        let humidity_controller = new HumidityController('100', '99');

        className = typeof className !== 'undefined' ? className : '';

        bus.emit('register_update_handler', {
            [type]: type
        });

        let testHumidity = humidity => {
            humidity = (humidity + '');
            if (humidity_controller.humidityMin > humidity_controller.humidityMax) {
                log.debug(`Humidity controller: Turn off dehumidifier: humidityMin greater than humidityMax`);
                vHelpers.sendUpdate(id, '.dehumidifier', {
                    dv: {
                        css: {
                            power: 'off'
                        }
                    }
                }, type);
            } else if (humidity && humidity <= humidity_controller.humidityMin) {
                log.debug(`Humidity controller: Turn off dehumidifier: ${humidity} <= ${humidity_controller.humidityMin}`);
                vHelpers.sendUpdate(id, '.dehumidifier', {
                    dv: {
                        css: {
                            power: 'off'
                        }
                    }
                }, type);
            } else if (humidity && humidity >= humidity_controller.humidityMax) {
                log.debug(`Humidity controller: Turn on dehumidifier: ${humidity} >= ${humidity_controller.humidityMax}`);
                vHelpers.sendUpdate(id, '.dehumidifier', {
                    dv: {
                        css: {
                            power: 'on'
                        }
                    }
                }, type);
            }
        };

        let addListener = () => {
            device_bus.on(type, data => {
                if (typeof data.update !== 'undefined' && typeof data.update.dv !== 'undefined') {
                    if (typeof data.update.dv.css !== 'undefined') {
                        if (typeof data.update.dv.css.humidityMax !== 'undefined') {
                            humidity_controller.humidityMax = (data.update.dv.css.humidityMax + '').replace(/\%/gi, '');
                            testHumidity(humidity_controller.humidity);
                        }

                        if (typeof data.update.dv.css.humidityMin !== 'undefined') {
                            humidity_controller.humidityMin = (data.update.dv.css.humidityMin + '').replace(/\%/gi, '');
                            testHumidity(humidity_controller.humidity);
                        }
                    } else if (typeof data.update.dv.d !== 'undefined' && typeof data.update.dv.d.humidity !== 'undefined') {
                        vHelpers.sendUpdate(id, '#' + id, {
                            dv: {
                                css: {
                                    humidity: data.update.dv.d.humidity + '%'
                                }
                            }
                        }, type);
                        humidity_controller.humidity = (data.update.dv.d.humidity + '').replace(/\%/gi, '');
                        testHumidity(data.update.dv.d.humidity);
                    }
                }
            });
        };
        testHumidity();
        vHelpers.createDevice(id, className, type).then(() => {
            return vHelpers.sendUpdate(id, '#' + id, {
                dv: {
                    css: {
                        humidityMin: humidity_controller.humidityMin + '%',
                        humidityMax: humidity_controller.humidityMax + '%'
                    }
                }
            }, type);
        }).then(() => {
            return vHelpers.createChannel(channel, id, type);
        }).then(() => {
            return vHelpers.subscribeToChannel(channel, id, type);
        }).then(addListener);
    };

    createHumidityController('humidity_controller', undefined, 'environment', 'virtual.humidity_controller');

};
