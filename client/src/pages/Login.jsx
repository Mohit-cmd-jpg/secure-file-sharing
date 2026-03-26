import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../services/api'

function Login() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({ email: '', password: '' })
    const [errors, setErrors] = useState({})
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const validateForm = () => {
        const newErrors = {}

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address'
        }

        if (!formData.password) {
            newErrors.password = 'Password is required'
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!validateForm()) {
            return
        }

        setLoading(true)

        try {
            const response = await login(formData)
            localStorage.setItem('token', response.data.token)
            localStorage.setItem('user', JSON.stringify(response.data.user))
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData({ ...formData, [name]: value })
        // Clear error for this field
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' })
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔒</div>
                    <h1 style={{ marginBottom: '0.5rem' }}>SecureShare</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Secure file sharing with blockchain verification</p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        {error}
                        <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            className={errors.email ? 'input-error' : ''}
                            disabled={loading}
                        />
                        {errors.email && <small style={{ color: 'var(--color-error)' }}>⚠️ {errors.email}</small>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                className={errors.password ? 'input-error' : ''}
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '0.75rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem'
                                }}
                                disabled={loading}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                        {errors.password && <small style={{ color: 'var(--color-error)' }}>⚠️ {errors.password}</small>}
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                        {loading ? '⏳ Signing in...' : '🔓 Sign In'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        New to SecureShare?
                    </p>
                    <Link to="/register" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '500' }}>
                        Create a free account →
                    </Link>
                </div>

                <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    <p style={{ marginBottom: '0.5rem' }}>✓ End-to-end encrypted file sharing</p>
                    <p style={{ marginBottom: '0.5rem' }}>✓ Blockchain-verified integrity</p>
                    <p>✓ IPFS-backed distributed storage</p>
                </div>
            </div>
        </div>
    )
}

export default Login
