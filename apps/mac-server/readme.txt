ub.js Node Client Example

Designed to be used in conjunction with ub.js: https://github.com/ub-js/ub.js

This example shows a Node client connecting to ub.

To install, place all files in a folder called "node-client-example" inside the
apps folder of ub.js.

You'll also need to go to "/path_to_ub/ub.js/apps/node-client-example/" and run
"npm install" to install all the dependencies for the client.

Before you run the example, change the config files, including the IP address of
the server in the client's config.json.

To run the example, start the server by typing "/path_to_ub/ub.js
/path_to_ub/ub.js/apps/node-client-example/ | bunyan -o short"

Then start the client, either on the same computer or a different one on the
same network.

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
