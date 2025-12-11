import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Layout/Navbar';
import ThemeSettings from './components/Theme/ThemeSettings';
import ThemeToggle from './components/Theme/ThemeToggle';
import ThemeWrapper from './components/Theme/ThemeWrapper';
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import Dashboard from './pages/Admin/Dashboard';
import CreatePost from './pages/Posts/CreatePost';
import EditPost from './pages/Posts/EditPost';
import PostDetail from './pages/Posts/PostDetail';
import Bookmarks from './pages/Bookmarks/Bookmarks';
import Profile from './pages/Profile/Profile';
import Documents from './pages/Documents/Documents';
import DocumentDetail from './pages/Documents/DocumentDetail';
import UploadDocument from './pages/Documents/UploadDocument';
import TestNotifications from './pages/TestNotifications';
import Notifications from './pages/Notifications/Notifications';
import MyReports from './pages/Reports/MyReports';
import TagPosts from './pages/Tags/TagPosts';
import Rules from './pages/Static/Rules';
import Contact from './pages/Static/Contact';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AdminRoute from './components/Auth/AdminRoute';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ThemeWrapper>
            <div className="App">
              <Navbar />
              <ThemeSettings />
              <ThemeToggle />
              <div className="container-fluid mt-4">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/posts/:id" element={<PostDetail />} />
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/documents/:id" element={<DocumentDetail />} />
                  <Route path="/profile/:id" element={<Profile />} />
                  <Route path="/tags/:slug" element={<TagPosts />} />
                  <Route path="/rules" element={<Rules />} />
                  <Route path="/contact" element={<Contact />} />
                  
                  {/* Protected Routes */}
                  <Route path="/create-post" element={
                    <ProtectedRoute>
                      <CreatePost />
                    </ProtectedRoute>
                  } />
                  <Route path="/posts/:id/edit" element={
                    <ProtectedRoute>
                      <EditPost />
                    </ProtectedRoute>
                  } />
                  <Route path="/bookmarks" element={
                    <ProtectedRoute>
                      <Bookmarks />
                    </ProtectedRoute>
                  } />
                  <Route path="/upload-document" element={
                    <ProtectedRoute>
                      <UploadDocument />
                    </ProtectedRoute>
                  } />
                  <Route path="/test-notifications" element={
                    <ProtectedRoute>
                      <TestNotifications />
                    </ProtectedRoute>
                  } />
                  <Route path="/notifications" element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  } />
                  <Route path="/my-reports" element={
                    <ProtectedRoute>
                      <MyReports />
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
          </ThemeWrapper>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
