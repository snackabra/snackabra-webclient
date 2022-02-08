.. image:: snackabra.svg
   :height: 100px
   :align: center
   :alt: The 'michat' Pet Logo

======================
 Snackabra Web Client
======================

For general documentation on Snackabra see:

* https://snackabra.io
* https://snackabra.github.org

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

::
   cp setup/template.env .env

You may want to make changes to it (see below).

Once done, you can simply:

::

   yarn install
   yarn build
   yarn start




Private Servers
===============

It will point your web app to the https://Privacy.App servers.

If you are running your own snackabra room server, you will need to
replace ``REACT_APP_ROOM_SERVER`` with the domain - it'll be something
like ``r.example.workers.dev``.

You can run a personal room server and still use public storage
servers, but you will only be able to read files, not upload. If you
want to be able to share photos and files, you will need your own
storage server as well, and set ``REACT_APP_STORAGE_SERVER`` to point
to it.


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




Notes
=====

The snackabra web (app) client is a reference fully featured
web client for the snackabra set of communication and data
sharing services. You can use it to connect to any rooms
on https://privacy.app or you can configure it to connect
to any snackabra server, including personal server.

The app is written in (mostly) React Native and based on the
(exellent) Gifted Chat code [1]. For a few reasons, we are
currently using a slightly modified fork [2].


References
==========

[1] https://github.com/FaridSafi/react-native-gifted-chat)
[2] https://github.com/Magnusson-Institute/react-native-gifted-chat



Directory
=========

Following files should be in the git::

    .
    ├── LICENSE.rst
    ├── README.rst
    ├── build
    ├── config-overrides.js
    ├── package.json
    ├── public
    │   ├── apple-touch-icon.png
    │   ├── favicon.ico
    │   ├── index.html
    │   ├── manifest.json
    │   └── robots.txt
    ├── snackabra.svg
    ├── src
    │   ├── App.css
    │   ├── App.tsx
    │   ├── components
    │   │   ├── Admin
    │   │   │   ├── Admin.css
    │   │   │   └── Admin.js
    │   │   ├── Guide
    │   │   │   ├── Guide.css
    │   │   │   └── Guide.js
    │   │   └── LandingPage
    │   │       ├── LandingPage.css
    │   │       └── LandingPage.js
    │   ├── containers
    │   │   ├── Modal
    │   │   │   ├── Modal.css
    │   │   │   └── Modal.jsx
    │   │   ├── Room
    │   │   │   ├── Room.css
    │   │   │   └── Room.js
    │   │   └── Snackabra
    │   │       ├── Snackabra.css
    │   │       └── Snackabra.js
    │   ├── index.css
    │   ├── index.tsx
    │   ├── locales
    │   │   └── en
    │   │       ├── messages.js
    │   │       └── messages.po
    │   ├── react-app-env.d.ts
    │   ├── static
    │   │   ├── attach.png
    │   │   ├── icons8-edit-24.png
    │   │   ├── icons8-lock-64.png
    │   │   ├── icons8-menu-48.png
    │   │   ├── icons8-open-in-popup-24.png
    │   │   ├── icons8-refresh-24.png
    │   │   ├── icons8-unlock-64.png
    │   │   ├── icons8-user-64.png
    │   │   └── lock_secure.png
    │   └── utils
    │       └── utils.js
    ├── tsconfig.json
    └── yarn.lock



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


