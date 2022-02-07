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
------------

This react native web client can connect to any Snackabra server -
public or private.

To run your own private "room server", you can install:

* https://github.com/snackabra/snackabra-roomserver



Setup
-----

You need to copy the template ".env" file to the root:

::
   cp setup/template.env .env

You may want to make changes to it (see below).

Once done, you can simply:

::

   yarn install
   yarn build
   yarn start

And 

Private Servers
---------------

It will point your web app to the https://Privacy.App servers.

If you are running your own snackabra room server, you will need to
replace ``REACT_APP_ROOM_SERVER`` with the domain - it'll be something
like ``r.example.workers.dev``.

You can run a personal room server and still use public storage
servers, but you will only be able to read files, not upload. If you
want to be able to share photos and files, you will need your own
storage server as well, and set ``REACT_APP_STORAGE_SERVER`` to point
to it.

With these setups, you can now try it out locally:

::



Notes
-----

The snackabra web (app) client is a reference fully featured
web client for the snackabra set of communication and data
sharing services. You can use it to connect to any rooms
on https://privacy.app or you can configure it to connect
to any snackabra server, including personal server.

The app is written in (mostly) React Native and based on the
(exellent) Gifted Chat code [1].


References
----------

[1] https://github.com/FaridSafi/react-native-gifted-chat)


Directory
---------

Following files should be in your directory:

  
::
   
    .
    ├── LICENSE.md
    ├── README.rst
    ├── config-overrides.js
    ├── package.json
    ├── public
    │   ├── apple-touch-icon.png
    │   ├── favicon.ico
    │   ├── index.html
    │   ├── manifest.json
    │   └── robots.txt
    ├── setup
    │   └── template.env
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
    │   │       └── snackabra.js
    │   ├── index.css
    │   ├── index.tsx
    │   ├── locales
    │   │   └── en
    │   │       ├── messages.js
    │   │       └── messages.po
    │   ├── react-app-env.d.ts
    │   ├── static
    │   │   ├── attach.png
    │   │   ├── download-file-square-line.png
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
-------

Copyright (c) 2016-2021 Magnusson Institute, All Rights Reserved.

"Snackabra" is a registered trademark

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Affero General Public License for more details.

Licensed under GNU Affero General Public License
https://www.gnu.org/licenses/agpl-3.0.html


Cryptography Notice
-------------------

This distribution includes cryptographic software. The country in
which you currently reside may have restrictions on the import,
possession, use, and/or re-export to another country, of encryption
software. Before using any encryption software, please check your
country's laws, regulations and policies concerning the import,
possession, or use, and re-export of encryption software, to see if
this is permitted. See http://www.wassenaar.org/ for more information.

United States: This distribution employs only "standard cryptography"
under BIS definitions, and falls under the Technology Software
Unrestricted (TSU) exception.  Futher, per the March 29, 2021,
amendment by the Bureau of Industry & Security (BIS) amendment of the
Export Administration Regulations (EAR), this "mass market"
distribution does not require reporting (see
https://www.govinfo.gov/content/pkg/FR-2021-03-29/pdf/2021-05481.pdf ).
