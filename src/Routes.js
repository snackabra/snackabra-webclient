/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Rooms from './pages/Rooms.js';
import PageNotFound from './components/PageNotFound.js';
import NavAppBar from "./components/NavAppBar.js";

const AppRoutes = () => {

  return (
      <Router>
        <NavAppBar />
        <Routes>
          <Route path="/404" element={<PageNotFound />} />
          <Route path="/" element={<Rooms />}>
            <Route path=":room_id" element={<Rooms />} />
          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
  )
}

export default AppRoutes
