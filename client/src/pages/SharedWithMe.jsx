import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getSharedFiles } from '../services/api'
import FilePreviewModal from '../components/FilePreviewModal'

function SharedWithMe() {
    const navigate = useNavigate()
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [previewModal, setPreviewModal] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [sortBy, setSortBy] = useState('date') // date, name, owner

    useEffect(() => {
        fetchSharedFiles()
    }, [])

    const fetchSharedFiles = async () => {
        try {
            setLoading(true)
            const response = await getSharedFiles()
            setFiles(response.data)
            setError('')
        } catch (err) {
            setError('Failed to fetch shared files')
            console.error(err)
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

    // Filter and sort
    const getSortedFiles = () => {
        let sorted = [...files].filter(file => 
            file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            file.owner.toLowerCase().includes(searchTerm.toLowerCase())
        )

        switch (sortBy) {
            case 'name':
                sorted.sort((a, b) => a.name.localeCompare(b.name))
                break
            case 'owner':
                sorted.sort((a, b) => a.owner.localeCompare(b.owner))
                break
            case 'date':
            default:
                sorted.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
        }

        return sorted
    }

    const sortedFiles = getSortedFiles()

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
                    <div>
                        <h1>Shared with Me</h1>
                        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            {sortedFiles.length} file{sortedFiles.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="alert alert-error">
                        {error}
                        <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                    </div>
                )}

                {/* Search and Sort */}
                {files.length > 0 && (
                    <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            placeholder="🔍 Search files or owner..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ flex: 1, minWidth: '250px', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                        />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                        >
                            <option value="date">Sort by: Date (Newest)</option>
                            <option value="name">Sort by: Name</option>
                            <option value="owner">Sort by: Owner</option>
                        </select>
                    </div>
                )}

                {loading ? (
                    <div className="empty-state">
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                        <p>Loading shared files...</p>
                    </div>
                ) : sortedFiles.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📨</div>
                        <h3>{files.length === 0 ? 'No shared files' : 'No matching files'}</h3>
                        <p>{files.length === 0 ? 'Files shared with you will appear here' : 'Try adjusting your search'}</p>
                    </div>
                ) : (
                    <div className="files-grid">
                        {sortedFiles.map((file) => (
                            <div key={file.id} className="file-card">
                                <div className="file-card-header">
                                    <div className="file-icon">📄</div>
                                    <div className="file-info">
                                        <h3 title={file.name}>{file.name}</h3>
                                        <p>{formatSize(file.size)}</p>
                                    </div>
                                </div>

                                <div className="file-meta">
                                    <span title={`Shared by: ${file.owner}`}>👤 {file.owner}</span>
                                    <span>📅 {new Date(file.uploadedAt).toLocaleDateString()}</span>
                                </div>

                                <div className="file-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <a
                                        href={file.ipfsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-primary btn-sm"
                                        title="Download from IPFS"
                                    >
                                        Download
                                    </a>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => setPreviewModal(file)}
                                        title="Preview file"
                                    >
                                        👁️ Preview
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* File Preview Modal */}
            <FilePreviewModal 
                file={previewModal} 
                isOpen={!!previewModal} 
                onClose={() => setPreviewModal(null)} 
            />
        </>
    )
}

export default SharedWithMe
