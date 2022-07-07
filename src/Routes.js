/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Rooms from './pages/Rooms';
import Guide from './pages/Guide';
import Home from './pages/Home';
import NavAppBar from "./components/NavAppBar";
import { StyledContainer } from "./styles/Container";

const AppRoutes = () => {

  return (
    <Router>
      <NavAppBar />
      <StyledContainer>
        <Routes>
          <Route exact path="/" element={<Home />} />
          <Route path="/rooms" element={<Rooms />}>
            <Route path=":room_id" element={<Rooms />} />
            <Route path=":room_id/admin" element={<Rooms />} />
          </Route>
          <Route exact path="/guide" element={<Guide />} />
        </Routes>
      </StyledContainer>
    </Router>
  )
}

export default AppRoutes
