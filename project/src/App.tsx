import React from 'react';
import { Container } from 'react-bootstrap';
import './App.css';
import ResourceSearch from './components/ResourceSearch';

function App() {
  return (
    <div className="app">
      <Container className="py-4">
        <h1 className="text-center mb-4">Resource Database</h1>
        <ResourceSearch />
      </Container>
    </div>
  );
}

export default App;