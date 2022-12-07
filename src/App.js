/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import React from 'react'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { messages } from './locales/en/messages'
import { en } from 'make-plural/plurals'
import AppRoutes from "./Routes";
import theme from "./theme";
import { ThemeProvider } from "@mui/material";
import { NotificationProvider } from "./contexts/NotificationContext";
import { SnackabraProvider } from "mobx-snackabra-store";
import NotificationBar from "./components/NotificationBar";

i18n.loadLocaleData({
  en: { plurals: en },
})
i18n.load('en', messages)
i18n.activate('en')

const sbConfig = {
  channel_server: process.env.REACT_APP_ROOM_SERVER,
  channel_ws: process.env.REACT_APP_ROOM_SERVER_WS,
  storage_server: process.env.REACT_APP_STORAGE_SERVER
}

const App = () => {
  return (
    <I18nProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <SnackabraProvider config={sbConfig}>
          <NotificationProvider>
            <AppRoutes />
            <NotificationBar />
          </NotificationProvider>
        </SnackabraProvider>
      </ThemeProvider>
    </I18nProvider>
  )
}

export default App
