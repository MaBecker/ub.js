/*jslint node: true */
/**
 * Web UI module
 * @module plugins/web_ui
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
        express = require('express'),
        passport = require('passport'),
        Strategy = require('passport-local').Strategy,
        ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn,
        bcrypt = require('bcryptjs'),
        findById,
        findByUsername,
        consumeRememberMeToken,
        saveRememberMeToken;

    if (config.authentication.storage === 'database') {
        let mongodb = require('mongodb'),
            dbClient = mongodb.MongoClient,
            url = `mongodb://${config.authentication.connection.host}:${config.authentication.connection.port}/${config.authentication.connection.database_name}`,
            db;

        bus.emit('register_termination_handler', () => {
            return new Promise((resolve, reject) => {
                if (typeof db !== 'undefined') {
                    log.debug('Web UI: closing database connection');
                    db.close();
                }
                resolve();
            });
        });

        dbClient.connect(url, (err, database) => {
            if (!err) {
                db = database;
                log.debug(`Web UI: Connected to mongodb: ${url}`);
            } else {
                log.error(`Web UI: Error connecting to mongodb: ${url}`);
            }
        });

        findById = id => {
            return new Promise((resolve, reject) => {
                let collection = db.collection('users'),
                    matchedUsers = [],
                    cursor = collection.find({
                        id
                    }, (err, cursor) => {
                        if (err) {
                            reject(err);
                        }
                        cursor.nextItem(function(err, item) {
                            if (err) {
                                reject(err);
                            }
                            if (item !== null) {
                                resolve(item);
                            } else {
                                reject();
                            }
                        });
                    });
            });
        };

        findByUsername = username => {
            return new Promise((resolve, reject) => {
                let collection = db.collection('users'),
                    cursor = collection.find({
                        username
                    }, (err, cursor) => {
                        if (err) {
                            reject(err);
                        }
                        cursor.nextObject(function(err, item) {
                            if (err) {
                                reject(err);
                            }
                            if (item !== null) {
                                resolve(item);
                            } else {
                                reject();
                            }
                        });
                    });
            });
        };

        consumeRememberMeToken = token => {
            return new Promise((resolve, reject) => {
                let collection = db.collection('tokens'),
                    cursor = collection.find({
                        token
                    }, (err, cursor) => {
                        cursor.next(function(err, item) {
                            if (err) {
                                reject(err);
                            }
                            if (item !== null) {
                                resolve(item.uid);
                            } else {
                                reject();
                            }
                        });
                    });
            });
        };

        saveRememberMeToken = (token, id) => {
            return new Promise((resolve, reject) => {
                let collection = db.collection('tokens'),
                    record = {
                        token,
                        id,
                        timestamp: Date.now()
                    };
    			collection.insert(record, function (err, result) {
    				if (err) {
                        reject(err);
    				} else {
                        resolve();
    				}
    			});
            });
        };
    } else if ((typeof config.authentication.storage === 'undefined' || config.authentication.storage === 'memory') && typeof config.authentication.users !== 'undefined') {
        let users = config.authentication.users,
            tokens = {};

        findById = id => {
            return new Promise((resolve, reject) => {
                let idx = id - 1;
                if (users[idx]) {
                    resolve(users[idx]);
                } else {
                    reject('User ' + id + ' does not exist');
                }
            });
        };

        findByUsername = username => {
            return new Promise((resolve, reject) => {
                for (let user in users) {
                    if (users[user].username === username) {
                        resolve(users[user]);
                    }
                }
            });
        };

        consumeRememberMeToken = token => {
            return new Promise((resolve, reject) => {
                let uid = tokens[token];
                delete tokens[token];
                resolve(uid);
            });
        };

        saveRememberMeToken = (token, id) => {
            return new Promise((resolve, reject) => {
                tokens[token] = id;
                resolve();
            });
        };
    }

    let issueToken = user => {
        let token = helpers.uuidGen();
        saveRememberMeToken(token, user.id);
        return token;
    };

    bus.emit('create', {
        r: helpers.idGen(),
        o: config.id,
        dv: {
            id: config.id
        }
    });

    // The bcrypt (synchronous) username/password strategy
    passport.use(new Strategy(
        function(username, password, done) {
            findByUsername(username).then(user => {
                if (!user) {
                    return done(null, false);
                }
                if (bcrypt.compareSync(password, user.password)) {
                    return done(null, user);
                }
                return done(null, false);
            }).catch(err => {
                log.error('Web UI: Failed to find user');
                return done(null, null);
            });
        }
    ));

    passport.serializeUser(function(user, callback) {
        callback(null, user.username);
    });

    passport.deserializeUser(function(username, callback) {
        callback(null, findByUsername(username));
    });

    let app = express();

    app.set('views', global.appPath + 'webui/');
    app.set('view engine', 'ejs');

    app.use(require('cookie-parser')());
    app.use(require('body-parser').urlencoded({
        extended: true
    }));
    app.use(require('body-parser').json());
    app.use(require('express-session')({
        secret: 'youdontknowwhatthisis',
        resave: false,
        saveUninitialized: false,
        maxAge: null
    }));

    app.use(passport.initialize());
    app.use(passport.session());
    app.use(express.static(global.appPath + 'webui/'));

    app.get('/',
        ensureLoggedIn('/login'),
        (req, res) => {
            log.debug('Web UI: Loading debug UI.')
            res.setHeader('Content-Type', 'text/html');

            let cssFormatted = '';
            for (let i in global.css.rules) {
                cssFormatted += `${global.css.rules[i].selector} {<br/>`;
                for (let property in global.css.rules[i].properties) {
                    if (global.css.rules[i].properties.hasOwnProperty(property)) {
                        cssFormatted += `&nbsp;&nbsp;&nbsp;&nbsp;${helpers.toHyphenCase(property)}: ${global.css.rules[i].properties[property]};<br/>`;
                    }
                }
                cssFormatted += '}<br/><br/>';
            }

            let domFormatted = '',
                indent = 4,
                prettyPrintElem = ($elem, level) => {
                    for (let i = 0; i < level * indent; i++) domFormatted += '&nbsp';
                    if ($elem.children().length > 0) {
                        domFormatted += $elem.clone().children().remove().end().wrap('<div>').parent().html().replace(/<\/[a-zA-Z]+>/g, '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    } else {
                        domFormatted += $elem.clone().wrap('<div>').parent().html().replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    }

                    $elem.children().each(function() {
                        domFormatted += '<br/>';
                        prettyPrintElem($(this), level + 1);
                    });

                    if ($elem.children().length > 0) {
                        domFormatted += '<br/>';
                        for (let i = 0; i < level * indent; i++) domFormatted += '&nbsp';
                        domFormatted += `&lt;/${$elem.prop('tagName').toLowerCase()}&gt;`;
                    }
                    level++;
                };
            prettyPrintElem($('hub'), 0);

            let output = `
            <html>
                <head>
                    <title>ub Debug</title>
                    <script src="https://cdn.rawgit.com/google/code-prettify/master/loader/run_prettify.js"></script>
                </head>
                <body>
                    <section>
                        <h1>DOM</h1>
                        <code class="prettyprint lang-html">${domFormatted}</code>
                    </section>
                    <section>
                        <h1>CSS</h1>
                        <code class="prettyprint lang-css">${cssFormatted}</code>
                    </section>
                </body>
            </html>`;

            res.write(output);
            res.end();
        });

    app.get('/mobile',
        ensureLoggedIn('/login'),
        function(req, res) {
            // mobile site here
        });

    app.get('/login',
        function(req, res) {
            res.render('login');
        });

    app.post('/login', (req, res, next) => {
        let setCookie = false;
        if (req.body.remember_me) {
            setCookie = true;
        }

        if (setCookie) {
            findByUsername(req.body.username).then(username => {
                if (typeof username !== 'undefined') {
                    let token = issueToken(username);
                    res.cookie('remember_me', token, {
                        path: '/',
                        httpOnly: true,
                        maxAge: 604800000
                    });
                    next();
                }
            }).catch(err => {
                log.error('Web UI: Cannot find user');
            });
        } else {
            next();
        }
    });

    app.post('/login', passport.authenticate('local', {
        successReturnToOrRedirect: '/',
        failureRedirect: '/login'
    }));

    app.get('/logout',
        function(req, res) {
            res.clearCookie('remember_me');
            req.logout();
            res.redirect('/');
        });

    app.post('/',
        ensureLoggedIn('/login'),
        (req, res) => {
            if (typeof req.body !== 'undefined') {
                if (typeof req.body.create !== 'undefined') {
                    bus.emit('create', req.body.create);
                } else if (typeof req.body.read !== 'undefined') {
                    bus.emit('read', req.body.read);
                } else if (typeof req.body.update !== 'undefined') {
                    bus.emit('update', req.body.update);
                } else if (typeof req.body.delete !== 'undefined') {
                    bus.emit('delete', req.body.delete);
                } else if (typeof req.body.response !== 'undefined') {
                    if (req.body.response.type === 'discover' && typeof req.body.response.dv.id !== 'undefined') {

                        let device_message = {
                            r: helpers.idGen(),
                            o: config.id,
                            dv: {
                                id: req.body.response.dv.id,
                                class: req.body.response.dv.class,
                                attr: {
                                    type: 'web',
                                    ip: req.body.response.dv.ip | req.connection.remoteAddress,
                                    port: req.body.response.dv.port
                                }
                            }
                        };

                        bus.emit('create', device_message);
                        log.debug(`Web UI: ${req.body.response.dv.id} recognised on port: ${req.connection.remoteAddress}`);
                    }
                }
            }
            res.end();
        });

    return app.listen(config.port, () => {
        log.debug('Web UI: Started');
    });
};
