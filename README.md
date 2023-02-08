<img style="height: 100px" src="snackabra.svg">


 Snackabra Web Client
======================

For general documentation on Snackabra see:

* https://snackabra.io

If you would like to contribute or help out with the snackabra
project, please feel free to reach out to us at snackabra@gmail.com or
snackabra@protonmail.com


Introduction
============

This react native web client can connect to any Snackabra server -
public or private.

To run your own private "room server", you can install:

* https://github.com/snackabra/snackabra-roomserver


Setup
=====

You need to copy the template ".env" file to the root:

``` bash
cp env.example .env
```
See below (Private Servers) for details: this file points your
webclient to your preferred ``snackabra`` servers (room and storage).

Once done, you can simply:

``` bash
yarn install
yarn start
```

It should be accessible on ``localhost:3000``.

To create an optimized production build:

``` bash
yarn build
```

In your project root a new folder ``build`` will contain your optimized production build. You can serve this build using the ``serve`` package from npmjs or whatever else you'd prefer.

If you're changing messages in the UI, you will occasionally need:

``` bash
yarn extract
yarn compile
```

To maintain the internationalization setup (though currently we
only support the ``en`` locale).

For development, one suggestion is to install the React Native Chrome
Extension [^1] and then open developer tools. When running the
extension against your local version (``yarn start``), you get the
"developer" build, and against your server you'll get "production"
build (which can also be tested locally).



Private Servers
===============

By default this build will point your web app to the
https://Privacy.App servers, you can change this in the env file:

Using the examples in ``.env.example`` in the root of the project, update the enviornmental variables for your enviornment.

Included the appropriate protocol for the servers you are attempting to reach. 

```
REACT_APP_CHANNEL_SERVER=https://r.example.workers.dev
REACT_APP_SHARD_SERVER=https://s.example.workers.dev
REACT_APP_CHANNEL_SERVER_WS=wss://r.example.workers.dev
```

``REACT_APP_CHANNEL_SERVER`` is for api calls over the ``channel`` server


``REACT_APP_SHARD_SERVER`` is for api calls over the ``shard`` server


``REACT_APP_CHANNEL_SERVER_WS`` communicatin over the ``channel`` socket


Of course you can also point it to any other public host as well. [^2]


Hosting your Client
===================

After ``yarn build``, you will have a set of static images (in the
'build' directory), that you can host in various ways. If you're
setting up the storage and room servers on Cloudflare, then
it might be simplest if you use Cloudflare "Pages". Detailed
documentation of how to do that is beyond the scope, but
it's pretty straightforward:

* First fork a copy for yourself of 'snackabra-webclient'

* On Cloudflare, select connecting to GitHub and authorizing
  it to you your forked repository.

* Select "React" as your choice of type of app / build.

* Change the default (which uses ``npm``) to be just
  ``yarn build``

Then build and deploy. If you are running your own
servers, you will also have to override the defaults in
the ".env" file.

It'll take a few minutes for most of the steps, in total it should
take less than 10-15 minutes.

Reminder: if you are setting up your own domain ("acme.com"), then
you should end up with something like this:

```
   acme.com    -> will server the static pages of this (web) client
   r.acme.com  -> this runs your snackabra-roomserver
   s.acme.com  -> this runs your snackabra-storageserver
```

Notes
=====

The snackabra web (app) client is a reference fully featured
web client for the snackabra set of communication and data
sharing services. You can use it to connect to any rooms
on https://privacy.app or you can configure it to connect
to any snackabra server, including personal server.

The app is written in (mostly) React Native and based on the
(exellent) Gifted Chat code. [^3]


LICENSE
=======

Copyright (c) 2016-2021 Magnusson Institute, All Rights Reserved.

"Snackabra" is a registered trademark

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice, the above trademark notice, and this
permission notice shall be included in all copies or substantial
portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NON-INFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


Footnotes

[^1]: [https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en)

[^2]: Future improvement will support having a list of snackabara servers that the client
	  can query for any room, "DNS-style".

[^3]: [https://github.com/FaridSafi/react-native-gifted-chat](https://github.com/FaridSafi/react-native-gifted-chat)