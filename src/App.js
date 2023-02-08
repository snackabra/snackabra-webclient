/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import React from 'react'
import { SafeAreaProvider } from "react-native-safe-area-context"
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { messages } from './locales/en/messages'
import { en } from 'make-plural/plurals'
import AppRoutes from "./Routes";
import theme from "./theme";
import { ThemeProvider } from "@mui/material";
import { NotificationProvider } from "./contexts/NotificationContext";
import { NavBarActionProvider } from "./contexts/NavBarActionContext";
import { LogProvider } from "./contexts/LogContext";
import { SnackabraProvider } from "mobx-snackabra-store";
import NotificationBar from "./components/NotificationBar";


i18n.loadLocaleData({
  en: { plurals: en },
})
i18n.load('en', messages)
i18n.activate('en')

const sbConfig = {
  channel_server: process.env.REACT_APP_CHANNEL_SERVER,
  channel_ws: process.env.REACT_APP_CHANNEL_SERVER_WS,
  storage_server: process.env.REACT_APP_SHARD_SERVER
}

const App = () => {
  return (
    <SafeAreaProvider>
      <I18nProvider i18n={i18n}>
        <ThemeProvider theme={theme}>
          <SnackabraProvider config={sbConfig}>
            <NotificationProvider>
              <NavBarActionProvider>
                <LogProvider>
                  <AppRoutes />
                </LogProvider>
                <NotificationBar />
              </NavBarActionProvider>
            </NotificationProvider>
          </SnackabraProvider>
        </ThemeProvider>
      </I18nProvider>
    </SafeAreaProvider>
  )
}

export default App
