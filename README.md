The "mac" branch is broken and not suitable for use.

# ub.js

ub.js is a free and open Web of Things platform for controlling lights, computers, sensors, heaters, toasters and all manner of connected devices. It uses CSS, JavaScript and jQuery, making it simple and accessible to Web developers (or any developers). ub allows for one-to-one and one-to-many messaging using syntax you’re already familiar with.

Full documentation is available [here](https://ub-js.github.io/).

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

Follow the guide [here](https://docs.mongodb.org/manual/administration/install-community/) for your OS

### Installing ub from npm

- Run "npm install ub-js" in terminal or command prompt

### Installing ub from git

- Run "git clone https://github.com/ub-js/ub.js.git" in terminal or command prompt
- Navigate to the directory you saved ub to and run "npm install" in terminal or command prompt

## Initial setup

Copy the *config.example.json* to *config.json*. This contains all the plugins that the Hub will load, see the full documentation for more details.

If you’re using MongoDB you’ll need to create a collection (with any name) and put this into *config.json*. Remote databases should also work.

## Usage

Normal mode: "/path_to_ub/hub.js"
App mode: "/path_to_ub/hub.js ./apps/app_directory/"

Note: some features require "sudo" or elevated privileges.

Examples are available in the "apps" directory. Documentation is available [here](http://ub-js.github.io).

## Contact

Please report all issues using the GitHub issue tracker [here](https://github.com/ub-js/ub-js.github.io/issues).

If you’d like to get in contact, please use Twitter [@ub_js](https://twitter.com/ub_js)

## License

ub, plugins and examples are licensed under a modified BSD3 License (clause 4 is additional):</p>

Copyright (c) 2016, Alex Owen

All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.</li>
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.</li>
3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.</li>
4. All commercial, industrial and large scale uses must be reported to the copyright holder.</li>

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
