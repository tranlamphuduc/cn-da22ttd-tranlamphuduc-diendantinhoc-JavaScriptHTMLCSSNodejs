import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Layout/Navbar';
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Admin/Dashboard';
import CreatePost from './pages/Posts/CreatePost';
import PostDetail from './pages/Posts/PostDetail';
import Profile from './pages/Profile/Profile';
import Documents from './pages/Documents/Documents';
import UploadDocument from './pages/Documents/UploadDocument';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AdminRoute from './components/Auth/AdminRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <div className="container-fluid mt-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/posts/:id" element={<PostDetail />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/profile/:id" element={<Profile />} />
              
              {/* Protected Routes */}
              <Route path="/create-post" element={
                <ProtectedRoute>
                  <CreatePost />
                </ProtectedRoute>
              } />
              <Route path="/upload-document" element={
                <ProtectedRoute>
                  <UploadDocument />
                </ProtectedRoute>
              } />
              
              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={
                <AdminRoute>
                  <Dashboard />
                </AdminRoute>
              } />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;