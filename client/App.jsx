import React from 'react';
import Nav from './Nav';
import Header from './Header';
import Sandbox from './Sandbox';
import { Playground } from 'graphql-playground-react';

const App = () => {
  return (
    <>
      <Nav />
      <Header />
      <Playground />
    </>
  )
};

export default App;
