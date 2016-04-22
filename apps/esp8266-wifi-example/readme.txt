ub.js ESP8266/WiFi Example

Designed to be used in conjunction with ub.js: https://github.com/ub-js/ub.js

This example demonstrates how ub.js can communicate with an ESP8266 flashed with
Espruino firmware, using WiFi and TCP sockets.

To install, place all files in a folder called "esp8266-wifi-example" inside
the apps folder of ub.js.

To run, type "/path_to_ub/ub.js /path_to_ub/ub.js/apps/esp8266-wifi-example/
| bunyan -o short"

You'll need an ESP8266 board for this example. You'll need to flash it with
Espruino firmware, and you'll need to upload the esp8266.wifi.dht22.js example
to the board.

Before you flash the example client you'll need to set the name of your WiFi
network and the password in the esp8266.wifi.dht22.js file. You also need to set
the IP address of your Hub towards the end of the file. These are stored in
plain text so this implementation is not particularly suitable for secure
installations.

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
