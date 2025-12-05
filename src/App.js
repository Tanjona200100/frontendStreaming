// src/App.js
import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import StreamingLogin from './login/login';
import HomePage from './home/home';
import ProtectedRoute from "./protection/ProtectedRoute";
import Socket from "./socket"

function App() {
  return (
    <Router>
      <Routes>
    
       
        <Route path="/" element={<StreamingLogin />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/socket"
          element={
            <ProtectedRoute>
              < Socket />
            </ProtectedRoute>
          }
        /> 
      
      </Routes>
    </Router>
  );
}

export default App;
