/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import React from 'react'
import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {messages} from './locales/en/messages'
import {en} from 'make-plural/plurals'
import {RoomProvider} from "./contexts/RoomContext";
import AppRoutes from "./Routes";
import theme from "./theme";
import {ThemeProvider} from "@mui/material";
import {NotificationProvider} from "./contexts/NotificationContext";
import NotificationBar from "./components/NotificationBar";
import {ActiveRoomProvider} from "./contexts/ActiveChatContext";
import {ServiceWorkerProvider} from "./contexts/ServiceWorkerContext"

i18n.loadLocaleData({
  en: {plurals: en},
})
i18n.load('en', messages)
i18n.activate('en')

const App: React.FC = () => {
  return (
    <I18nProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ServiceWorkerProvider>
            <RoomProvider>
              <ActiveRoomProvider>
                <AppRoutes />
              </ActiveRoomProvider>
            </RoomProvider>
          </ServiceWorkerProvider>
          <NotificationBar />
        </NotificationProvider>
      </ThemeProvider>
    </I18nProvider>
  )
}

export default App
