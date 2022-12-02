/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Rooms from './pages/Rooms';
import NavAppBar from "./components/NavAppBar";
import { StyledContainer } from "./styles/Container";

const AppRoutes = () => {

  return (
    <Router>
      <NavAppBar />
      <StyledContainer>
        <Routes>
          <Route path="/" element={<Rooms />}>
            <Route path=":room_id" element={<Rooms />} />
            <Route path=":room_id/admin" element={<Rooms />} />
          </Route>
        </Routes>
      </StyledContainer>
    </Router>
  )
}

export default AppRoutes
