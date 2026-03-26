import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../services/api'

function Register() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        walletAddress: ''
    })
    const [errors, setErrors] = useState({})
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [connectingWallet, setConnectingWallet] = useState(false)

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
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            newErrors.password = 'Password must contain uppercase, lowercase, and numbers'
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password'
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match'
        }

        if (formData.walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(formData.walletAddress)) {
            newErrors.walletAddress = 'Invalid Ethereum wallet address'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (!validateForm()) {
            return
        }

        setLoading(true)

        try {
            const response = await register({
                email: formData.email,
                password: formData.password,
                walletAddress: formData.walletAddress || null
            })
            localStorage.setItem('token', response.data.token)
            localStorage.setItem('user', JSON.stringify(response.data.user))
            setSuccess('✓ Account created successfully! Redirecting...')
            setTimeout(() => navigate('/dashboard'), 1500)
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.')
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

    const connectWallet = async () => {
        if (typeof window.ethereum === 'undefined') {
            setError('Please install MetaMask to connect a wallet')
            return
        }

        setConnectingWallet(true)
        setError('')

        try {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            })
            setFormData({ ...formData, walletAddress: accounts[0] })
            setSuccess(`✓ Wallet connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`)
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            setError('Failed to connect wallet. ' + err.message)
        } finally {
            setConnectingWallet(false)
        }
    }

    const passwordStrength = () => {
        let strength = 0
        if (formData.password.length >= 8) strength++
        if (/[A-Z]/.test(formData.password)) strength++
        if (/[a-z]/.test(formData.password)) strength++
        if (/\d/.test(formData.password)) strength++
        if (/[^A-Za-z0-9]/.test(formData.password)) strength++
        return strength
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔒</div>
                    <h1 style={{ marginBottom: '0.5rem' }}>Create Account</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Start sharing files securely with blockchain verification</p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        {error}
                        <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                    </div>
                )}

                {success && (
                    <div className="alert alert-success">
                        {success}
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
                        {formData.password && (
                            <div style={{ marginTop: '0.5rem' }}>
                                <small style={{ color: 'var(--text-muted)' }}>Strength: </small>
                                <div style={{ display: 'flex', gap: '2px', marginTop: '0.25rem' }}>
                                    {[...Array(5)].map((_, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                height: '4px',
                                                flex: 1,
                                                backgroundColor: i < passwordStrength() ? 'var(--color-success)' : 'var(--border-color)',
                                                borderRadius: '2px'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        {errors.password && <small style={{ color: 'var(--color-error)' }}>⚠️ {errors.password}</small>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="confirmPassword"
                                type={showConfirm ? 'text' : 'password'}
                                name="confirmPassword"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={errors.confirmPassword ? 'input-error' : ''}
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
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
                                {showConfirm ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                        {errors.confirmPassword && <small style={{ color: 'var(--color-error)' }}>⚠️ {errors.confirmPassword}</small>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="walletAddress">Wallet Address (Optional)</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                id="walletAddress"
                                type="text"
                                name="walletAddress"
                                placeholder="0x..."
                                value={formData.walletAddress}
                                onChange={handleChange}
                                style={{ flex: 1 }}
                                disabled={loading}
                                className={errors.walletAddress ? 'input-error' : ''}
                            />
                            <button 
                                type="button" 
                                className="btn btn-secondary" 
                                onClick={connectWallet}
                                disabled={loading || connectingWallet}
                            >
                                {connectingWallet ? '⏳' : '🔗'}
                            </button>
                        </div>
                        {errors.walletAddress && <small style={{ color: 'var(--color-error)' }}>⚠️ {errors.walletAddress}</small>}
                        <small style={{ color: 'var(--text-muted)' }}>Connect MetaMask to auto-fill your wallet address</small>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                        {loading ? '⏳ Creating account...' : '✨ Create Account'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        Already have an account?
                    </p>
                    <Link to="/login" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '500' }}>
                        Sign in to your account →
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Register
