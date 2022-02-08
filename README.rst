.. image:: snackabra.svg
   :height: 100px
   :align: center
   :alt: The 'michat' Pet Logo

====================
Snackabra Web Client
====================

For general documentation on Snackabra see:

* https://snackabra.io
* https://snackabra.github.org

If you would like to contribute or help out with the snackabra
project, please feel free to reach out to us at snackabra@gmail.com or
snackabra@protonmail.com


Introduction
------------

The snackabra web (app) client is a fully featured web client for the
snackabra set of communication and data sharing services. You can use
it to connect to any rooms on public servers such as,
https://privacy.app or you can configure it to connect to any
snackabra server, including a personal server (see below).



Setup
-----

You need to copy the template ".env" file to the root:

::
   cp setup/template.env .env

If you're connecting to public servers, you don't need to modify it;
otherwise, see below.

Besides that, just run the following:

::

   yarn install
   yarn build
   yarn start

That should open snackabra client in your web browser (at ``http://localhost:3000/``).

*TODO: with some yarn / babel / etc tweaks, this should be buildable
into a single static file that you can run locally without a server.*


If you modify any of the strings / documentation, you'll also need
to run:

::

   yarn extract
   yarn compile

   


Private Servers
---------------

Your template '.env" file will point to (public) https://Privacy.App
servers. This gives you the ability to run a static local web app.

If you are running your own snackabra room server
(github.com/snackabra/snackabra-roomserver), you will need to replace
``REACT_APP_ROOM_SERVER`` with the domain - it'll be something like
``r.example.workers.dev``.

You can run a personal room server and still use public storage
servers (github.com/snackabra/snackabra-storageserver), but you will
only be able to read files, not upload. If you want to be able to
share photos and files and manage storage yourself, you will need your
own storage server as well, and set ``REACT_APP_STORAGE_SERVER`` to
point to it.



Notes
-----

The app is written in (mostly) React Native and based on the
(exellent) Gifted Chat code
https://github.com/FaridSafi/react-native-gifted-chat



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
