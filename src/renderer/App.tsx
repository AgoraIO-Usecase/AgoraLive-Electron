import React, { useState } from 'react'
import {
  HashRouter as Router,
  Route,
  Switch,
} from 'react-router-dom'
import './App.global.scss'
import Home from './pages/Home'
import Capture from './pages/Capture'

const App :React.FC = () => {

  return (
    <Router>
      <Switch>
        <Route path="/capture" children={<Capture />} />
        <Route path="/" children={<Home />} />
      </Switch>
    </Router>
  )
}
export default App