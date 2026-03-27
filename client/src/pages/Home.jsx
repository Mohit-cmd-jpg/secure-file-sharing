import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

function Home() {
    const navigate = useNavigate()

    useEffect(() => {
        // If user is already logged in, redirect to dashboard
        const token = localStorage.getItem('token')
        if (token) {
            navigate('/dashboard')
        }
    }, [navigate])

    const features = [
        {
            icon: '🔒',
            title: 'Secure Upload',
            description: 'Upload files up to 10MB with encrypted storage on IPFS'
        },
        {
            icon: '🤝',
            title: 'Easy Sharing',
            description: 'Share files with others using just their email address'
        },
        {
            icon: '📁',
            title: 'File Management',
            description: 'Organize, search, and manage all your files in one place'
        },
        {
            icon: '👁️',
            title: 'File Preview',
            description: 'Preview images, videos, and text before downloading'
        },
        {
            icon: '🌍',
            title: 'Distributed Storage',
            description: 'Your files are stored on IPFS, decentralized and always available'
        }
    ]

    const steps = [
        {
            number: '1',
            title: 'Create Account',
            description: 'Sign up with your email and secure password'
        },
        {
            number: '2',
            title: 'Upload Files',
            description: 'Upload your files securely'
        },
        {
            number: '3',
            title: 'Share Securely',
            description: 'Share with others and control who has access'
        }
    ]

    return (
        <>
            <nav className="navbar" style={{ borderBottom: '2px solid var(--primary)' }}>
                <div className="container navbar-content">
                    <span className="navbar-brand" style={{ fontSize: '1.5rem' }}>🔒 SecureShare</span>
                    <div className="navbar-links">
                        <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ width: 'auto' }}>
                            Sign In
                        </button>
                        <button onClick={() => navigate('/register')} className="btn btn-secondary" style={{ width: 'auto' }}>
                            Create Account
                        </button>
                    </div>
                </div>
            </nav>

            <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
                {/* Hero Section */}
                <section style={{
                    padding: '6rem 2rem',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                    textAlign: 'center'
                }}>
                    <div className="container" style={{ maxWidth: '800px' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔐</div>
                        <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '1rem', background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            Secure File Sharing
                        </h1>
                        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                            Upload, share, and manage your files. Decentralized, secure, and fully under your control.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button onClick={() => navigate('/register')} className="btn btn-primary" style={{ width: 'auto', fontSize: '1.1rem', padding: '1rem 2rem' }}>
                                ✨ Get Started Free
                            </button>
                            <button onClick={() => {
                                document.getElementById('features').scrollIntoView({ behavior: 'smooth' })
                            }} className="btn btn-secondary" style={{ width: 'auto', fontSize: '1.1rem', padding: '1rem 2rem' }}>
                                📚 Learn More
                            </button>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" style={{ padding: '6rem 2rem' }}>
                    <div className="container">
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '700', textAlign: 'center', marginBottom: '0.5rem' }}>
                            Powerful Features
                        </h2>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '3rem' }}>
                            Everything you need for secure file management
                        </p>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '2rem'
                        }}>
                            {features.map((feature, index) => (
                                <div key={index} style={{
                                    background: 'var(--surface)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '12px',
                                    padding: '2rem',
                                    transition: 'transform 0.3s, box-shadow 0.3s'
                                }}
                                className="feature-card"
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-8px)'
                                    e.currentTarget.style.boxShadow = '0 20px 40px -20px rgba(99, 102, 241, 0.3)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = 'none'
                                }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                                        {feature.icon}
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                                        {feature.title}
                                    </h3>
                                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section style={{
                    padding: '6rem 2rem',
                    background: 'var(--surface)',
                    borderTop: '1px solid var(--border)'
                }}>
                    <div className="container">
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '700', textAlign: 'center', marginBottom: '3rem' }}>
                            How It Works
                        </h2>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '2rem'
                        }}>
                            {steps.map((step, index) => (
                                <div key={index} style={{ textAlign: 'center', position: 'relative' }}>
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        background: 'var(--gradient)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.5rem',
                                        fontWeight: '700',
                                        margin: '0 auto 1.5rem'
                                    }}>
                                        {step.number}
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                                        {step.title}
                                    </h3>
                                    <p style={{ color: 'var(--text-muted)' }}>
                                        {step.description}
                                    </p>
                                    {index < steps.length - 1 && (
                                        <div style={{
                                            position: 'absolute',
                                            right: '-1rem',
                                            top: '30px',
                                            fontSize: '2rem',
                                            color: 'var(--border)'
                                        }}>
                                            →
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section style={{
                    padding: '4rem 2rem',
                    textAlign: 'center'
                }}>
                    <div className="container" style={{ maxWidth: '600px' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1.5rem' }}>
                            Ready to Secure Your Files?
                        </h2>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                            Join thousands of users who trust SecureShare for their important files
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button onClick={() => navigate('/register')} className="btn btn-primary" style={{ width: 'auto', padding: '1rem 2rem' }}>
                                Create Free Account
                            </button>
                            <button onClick={() => navigate('/login')} className="btn btn-secondary" style={{ width: 'auto', padding: '1rem 2rem' }}>
                                Sign In
                            </button>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer style={{
                    borderTop: '1px solid var(--border)',
                    padding: '2rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.875rem'
                }}>
                    <div className="container">
                        <p style={{ marginBottom: '1rem' }}>
                            🔒 SecureShare © 2026 • Secure File Sharing
                        </p>
                        <p>
                            Built with React, Express, MongoDB & IPFS
                        </p>
                    </div>
                </footer>
            </div>
        </>
    )
}

export default Home
