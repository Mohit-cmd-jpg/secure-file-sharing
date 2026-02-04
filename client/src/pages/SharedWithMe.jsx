import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getSharedFiles } from '../services/api'

function SharedWithMe() {
    const navigate = useNavigate()
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchSharedFiles()
    }, [])

    const fetchSharedFiles = async () => {
        try {
            const response = await getSharedFiles()
            setFiles(response.data)
        } catch (err) {
            setError('Failed to fetch shared files')
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
    }

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    return (
        <>
            <nav className="navbar">
                <div className="container navbar-content">
                    <span className="navbar-brand">🔒 SecureShare</span>
                    <div className="navbar-links">
                        <Link to="/dashboard">My Files</Link>
                        <Link to="/upload">Upload</Link>
                        <Link to="/shared-with-me" className="active">Shared with Me</Link>
                        <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <div className="container dashboard">
                <div className="dashboard-header">
                    <h1>Shared with Me</h1>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {loading ? (
                    <div className="empty-state">Loading...</div>
                ) : files.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📨</div>
                        <h3>No shared files</h3>
                        <p>Files shared with you will appear here</p>
                    </div>
                ) : (
                    <div className="files-grid">
                        {files.map((file) => (
                            <div key={file.id} className="file-card">
                                <div className="file-card-header">
                                    <div className="file-icon">📄</div>
                                    <div className="file-info">
                                        <h3>{file.name}</h3>
                                        <p>{formatSize(file.size)}</p>
                                    </div>
                                </div>

                                <div className="file-meta">
                                    <span>👤 {file.owner}</span>
                                    <span>📅 {new Date(file.uploadedAt).toLocaleDateString()}</span>
                                </div>

                                <div className="file-actions">
                                    <a
                                        href={file.ipfsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-primary btn-sm"
                                    >
                                        Download
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}

export default SharedWithMe
