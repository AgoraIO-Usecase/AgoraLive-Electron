import React, { useState } from 'react'
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
} from 'react-router-dom'
import './App.global.scss'
import Home from './pages/Home'

const App :React.FC = () => {
  return (
    <Router>
      <Switch>
        <Route path="/" children={<Home />} />
      </Switch>
    </Router>
  )
}
export default App