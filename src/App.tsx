/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import React from 'react'
import Snackabra from './containers/Snackabra/snackabra'
import './App.css'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { messages } from './locales/en/messages'
import { en } from 'make-plural/plurals'

i18n.loadLocaleData({
  en: { plurals: en },
})
i18n.load('en', messages)
i18n.activate('en')


const App: React.FC = () => {
  return (
    <I18nProvider i18n={i18n}>
      <Snackabra />
    </I18nProvider>
  )
}

export default App
