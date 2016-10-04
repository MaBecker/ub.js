/*jslint node: true */
/**
 * Manage database users for the Web UI
 *
 *
 * @author Alex Owen
 */

'use strict';

let bcrypt = require('bcryptjs'),
    mongodb = require('mongodb'),
    read = require('readline-sync'),
    dbClient = mongodb.MongoClient,
    url = '',
    db,
    fs = require('fs'),
    configFile = {};

try {
    configFile = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
} catch (e) {
    console.log(e);
}

let config = configFile.modules.webui.config.authentication.connection;
url = `mongodb://${config.host}:${config.port}/${config.database_name}`;

dbClient.connect(url, (err, database) => {
    if (!err) {
        db = database;
        console.log(`Connected to mongodb: ${url}`);
        getUserInput();
    } else {
        console.log(`Error connecting to mongodb: ${url}`);
    }
});

let getUserInput = () => {

    let error = false;
    let task = '';

    while (task !== 'c' && task !== 'd') {
        if (error) {
            console.log('You must enter C or D.');
            error = false;
        }
        task = read.question('What do you want to do? : [(C)reate / (D)elete] ').toLowerCase();
        if (task !== 'c' && task !== 'd') {
            error = true;
        }
    }
    error = false;

    if (task.toLowerCase() === 'c') {
        console.log('Creating a new user.');

        let user = '',
            password = '.',
            passwordConfirm = '..';

        while (!/[a-zA-Z0-9]+/.test(user)) {
            if (error) {
                console.log('The username must be in the correct format.');
                error = false;
            }
            user = read.question('Enter the username to create: [upper/lower case alphanumeric] ');
            if (!/[a-zA-Z0-9]+/.test(user)) error = true;
        }
        error = false;

        while (password !== passwordConfirm) {
            password = '.';
            passwordConfirm = '..';

            if (error) {
                console.log('Passwords must match.');
                error = false;
            }

            while (!/[a-zA-Z0-9]+/.test(password)) {
                if (error) {
                    console.log('The password must be in the correct format.');
                    error = false;
                }
                password = read.question('Enter the password for the user: [upper/lower case alphanumeric] ', {hideEchoBack: true});
                if (!/[a-zA-Z0-9]+/.test(password)) error = true;
            }
            error = false;

            while (!/[a-zA-Z0-9]+/.test(passwordConfirm)) {
                if (error) {
                    console.log('The password must be in the correct format.');
                    error = false;
                }
                passwordConfirm = read.question('Enter the password for the user: [upper/lower case alphanumeric] ', {hideEchoBack: true});
                if (!/[a-zA-Z0-9]+/.test(passwordConfirm)) error = true;
            }
            error = false;

            if (password !== passwordConfirm) error = true;
        }

        let passwordHash = bcrypt.hashSync(password);
        db.collection('users').insertOne({
            username: user,
            password: passwordHash
        }, function(err, r) {
            if (err) {
                console.log(err);
            } else {
                console.log('Create successful.');
            }
            db.close();
            process.exit();
        });

    } else if (task.toLowerCase() === 'd') {
        console.log('Deleting a user.');
        let user = '';
        while (!/[a-zA-Z0-9]+/.test(user)) {
            if (error) {
                console.log('The username must be in the correct format.');
                error = false;
            }
            user = read.question('Enter the username for the user: [upper/lower case alphanumeric] ');
            if (!/[a-zA-Z0-9]+/.test(user)) error = true;
        }
        error = false;

        db.collection('users').find({username: user}).limit(1).toArray(function(err, docs) {
            if (err) {
                console.log(err);
            } else if (docs.length === 0) {
                console.log('User does not exist.');
                db.close();
                process.exit();
            }

            db.collection('users').deleteOne({
                username: user
            }, function(err, r) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Delete successful.');
                }
                db.close();
                process.exit();
            });
        });
    }


};
