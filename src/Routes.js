/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SafeAreaView } from 'react-native-safe-area-context';
import Rooms from './pages/Rooms';
import PageNotFound from './components/PageNotFound';
import NavAppBar from "./components/NavAppBar";

const AppRoutes = () => {

  return (
    <SafeAreaView>
      <Router>
        <NavAppBar />
        <Routes>
          <Route path="/404" element={<PageNotFound />} />
          <Route path="/" element={<Rooms />}>
            <Route path=":room_id" element={<Rooms />} />
            {/* <Route path=":room_id/admin" element={<Rooms />} /> */}
          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
    </SafeAreaView>
  )
}

export default AppRoutes
