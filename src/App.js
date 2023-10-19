/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import React from 'react'
import { ThemeProvider } from "@mui/material";
import { SafeAreaProvider } from "react-native-safe-area-context"
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { messages } from './locales/en/messages.js'
import { en } from 'make-plural/plurals'
import AppRoutes from "./Routes.js";
import theme from "./theme.js";
import { NotificationProvider } from "./contexts/NotificationContext.js";
import { NavBarActionProvider } from "./contexts/NavBarActionContext.js";
import { SharedRoomStateProvider } from "./contexts/SharedRoomState.js";
import { SnackabraProvider } from "./contexts/SnackabraContext.js";
import NotificationBar from "./components/NotificationBar.js";
import { VoipProvider } from './contexts/Voip/VoipContext.js'
// import { LogProvider } from "./contexts/LogContext";



i18n.loadLocaleData({
  en: { plurals: en },
})
i18n.load('en', messages)
i18n.activate('en')

const sbConfig = {
  channel_server: process.env.REACT_APP_CHANNEL_SERVER,
  channel_ws: process.env.REACT_APP_CHANNEL_SERVER_WS,
  storage_server: process.env.REACT_APP_STORAGE_SERVER,
  shard_server: process.env.REACT_APP_SHARD_SERVER
}

// provider hierarchy
const App = () => {
  return (
    <SafeAreaProvider>
      <I18nProvider i18n={i18n}>
        <ThemeProvider theme={theme}>
          <SnackabraProvider config={sbConfig}>
            <NotificationProvider>
              <SharedRoomStateProvider>
                <NavBarActionProvider>
                  <VoipProvider config={sbConfig}>
                    {/* <LogProvider> */}
                    <AppRoutes />
                    {/* </LogProvider> */}
                  </VoipProvider>
                  <NotificationBar />
                </NavBarActionProvider>
              </SharedRoomStateProvider>
            </NotificationProvider>
          </SnackabraProvider>
        </ThemeProvider>
      </I18nProvider>
    </SafeAreaProvider>
  )
}

export default App
