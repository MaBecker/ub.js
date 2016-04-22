/*jslint node: true */
/**
 * MongoDB module
 * @module socket
 *
 * This module stores records to a mongoDB instance
 *
 * @author Alex Owen
 */

'use strict';

/** Initialise the module
 *  @param config - configuration parameters
 */
exports.init = config => {

    let bus = global.bus,
        log = global.log,
        $ = global.$,
        device_bus = global.device_bus,
        helpers = global.helpers,
        mongodb = require('mongodb'),
		dbClient = mongodb.MongoClient,
		url = `mongodb://${config.host}:${config.port}/${config.database_name}`,
        db;

	bus.emit('create', {
		r: helpers.idGen(),
		o: config.id,
		dv: {
			id: config.id,
			attr: {
				type: 'database'
			}
		}
	});

	bus.emit('register_update_handler', {database: config.updateHandler});
    bus.emit('register_termination_handler', () => {
        return new Promise((resolve, reject) => {
            if (typeof db !== 'undefined') {
                log.debug('Database: closing database connection');
                db.close();
            }
            resolve();
        });
    });

    dbClient.connect(url, function (err, database) {
        if (err) {
            log.error(`Database: Connection error: ${err}`);
        } else {
            db = database;
        }
    });

	let update = (record, collectionName) => {
		if (typeof db !== 'undefined') {
			let collection = db.collection(collectionName);
			record.timestamp = Date.now();
			collection.insert(record, function (err, result) {
				if (err) {
					log.error(`Database: Insert error: ${err}`);
				} else {
					log.debug(`Database: Successfully added record ${record} to ${collectionName}`);
				}
			});
		}
	};

	device_bus.on(config.updateHandler, data => {
		if (typeof data.update !== 'undefined' && typeof data.update.s !== 'undefined' && $(data.update.s).attr('id') === config.id) {
			if (typeof data.update.dv !== 'undefined' && typeof data.update.dv.d !== 'undefined' && typeof data.update.ch !== 'undefined') {

				let record = {
					ch: data.update.ch,
					d: data.update.dv.d,
					o: data.update.o
				};

				update(record, 'data');
			}
		} else if (typeof data.read !== 'undefined' && typeof data.read.s !== 'undefined' && $(data.read.s).attr('id') === config.id) {
            //TODO: implement this
        }
	});

};
