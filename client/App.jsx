import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Home from './pages/index';
import Hero from './components/Hero/Hero';


const App = () => {
  return (
    <Router>
      <Home />
      <Hero />
    </Router>
  );
};

export default App;
