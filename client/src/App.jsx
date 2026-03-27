import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import SharedWithMe from './pages/SharedWithMe'

function App() {
    useEffect(() => {
        const checkSession = () => {
            const token = localStorage.getItem('token')
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]))
                    if (payload.exp * 1000 < Date.now()) {
                        localStorage.removeItem('token')
                        localStorage.removeItem('user')
                        window.location.href = '/login'
                    }
                } catch (e) {
                    localStorage.removeItem('token')
                    localStorage.removeItem('user')
                }
            }
        }

        const interval = setInterval(checkSession, 60000)
        checkSession()

        return () => clearInterval(interval)
    }, [])

    const isAuthenticated = () => {
        const token = localStorage.getItem('token')
        if (!token) return false
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            return payload.exp * 1000 >= Date.now()
        } catch (e) {
            return false
        }
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
                <Route path="/" element={<Home />} />
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
            </Routes>
        </BrowserRouter>
    )
}

export default App
