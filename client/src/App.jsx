import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import SharedWithMe from './pages/SharedWithMe'

function App() {
    const isAuthenticated = () => {
        return localStorage.getItem('token') !== null
    }

    const ProtectedRoute = ({ children }) => {
        if (!isAuthenticated()) {
            return <Navigate to="/login" replace />
        }
        return children
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={
                    <ProtectedRoute><Dashboard /></ProtectedRoute>
                } />
                <Route path="/upload" element={
                    <ProtectedRoute><Upload /></ProtectedRoute>
                } />
                <Route path="/shared-with-me" element={
                    <ProtectedRoute><SharedWithMe /></ProtectedRoute>
                } />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
