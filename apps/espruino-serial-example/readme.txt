ub.js Espruino/Serial Example

Designed to be used in conjunction with ub.js: https://github.com/ub-js/ub.js

This example demonstrates how ub.js can communicate with Espruino over serial.

To install, place all files in a folder called "espruino-serial-example" inside
the apps folder of ub.js.

To run, type "/path_to_ub/ub.js /path_to_ub/ub.js/apps/espruino-serial-example/
| bunyan -o short"

You'll need an Espruino board (or compatible) and you'll need to upload the
espruino.serial.button.js example to the board.

If you want to ignore a serial port (you're using it for something else) then
add an exception to the config.json file at serial.config.exclusions.

In order for ub to communicate with the Espruino board it needs to move the
Espruino console to a different place. You can configure this in the
espruino.serial.button.js file. Be default the Espruino console is moved to
Serial1, and USB serial is used for communicating between ub and Espruino.

If you want to debug the client then you'll need to connect a USB to serial
adapter to the TX, RX of Serial1 on Espruino and connect the ground pins. This
will let you see the Espruino console which will show errors.

You can see whether the client has connected by looking at the log outputs, and
from the debug web interface at http://localhost:3000/debug.


License

Copyright (c) 2016, Alex Owen
All rights reserved.
Redistribution and use in source and binary forms, with or without modification,
 are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
this list of conditions and the following disclaimer in the documentation and/or
other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors
may be used to endorse or promote products derived from this software without
specific prior written permission.

4. All commercial, industrial and large scale uses must be reported to the
copyright holder.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
