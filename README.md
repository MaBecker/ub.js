# ub.js

ub.js is a free and open Web of Things platform for controlling lights, computers, sensors, heaters, toasters and all manner of connected devices. It uses CSS, JavaScript and jQuery, making it simple and accessible to Web developers (or any developers). ub allows for one-to-one and one-to-many messaging using syntax you’re already familiar with.

## Installation

### Supported platforms

- OS X
- Linux
- Windows 7+ (requires more testing)

### Pre-requisites

- Node.js v5.5.0+
- npm
- Git (optional)
- MongoDB (optional)

### (Optionally) install MongoDB

Follow the guide here for your OS: https://docs.mongodb.org/manual/administration/install-community/

### Installing ub from npm

- Run "npm install ub-js" in terminal or command prompt

### Installing ub from git

- Run "git clone https://github.com/ub-js/ub.js.git" in terminal or command prompt
- Navigate to the directory you saved ub to and run "npm install" in terminal or command prompt

### Installing Bunyan for logging

Bunyan is a logging helper and used by ub to format its output. Installation isn’t necessary, but to correctly format the output you may want to install Bunyan globally using "npm install -g bunyan".

## Initial setup

Copy the *config.example.json* to *config.json*. This contains all the plugins that the Hub will load, see the full documentation for more details.

If you’re using MongoDB you’ll need to create a collection (with any name) and put this into *config.json*. Remote databases should also work.

## Usage

Normal mode: "/path_to_ub/ub.js | bunyan -o short"
App mode: "/path_to_ub/ub.js ./apps/app_directory/ | bunyan -o short"

Note: some features require "sudo" or elevated privileges.

Examples are available in the "apps" directory. Documentation is available [here](http://ub-js.github.io).

## Contact

Please report all issues using the GitHub issue tracker [here](https://github.com/ub-js/ub-js.github.io/issues).

If you’d like to get in contact, please do via Twitter [@ub_js](https://twitter.com/ub_js)
