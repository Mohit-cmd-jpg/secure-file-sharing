import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ethers } from 'ethers'
import { getMyFiles, shareFile, revokeAccess } from '../services/api'
import { getContract } from '../services/contract'

function Dashboard() {
    const navigate = useNavigate()
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [shareModal, setShareModal] = useState(null)
    const [shareEmail, setShareEmail] = useState('')
    const [verifyResult, setVerifyResult] = useState(null)

    const user = JSON.parse(localStorage.getItem('user') || '{}')

    useEffect(() => {
        fetchFiles()
    }, [])

    const fetchFiles = async () => {
        try {
            const response = await getMyFiles()
            setFiles(response.data)
        } catch (err) {
            setError('Failed to fetch files')
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
    }

    const handleShare = async (e) => {
        e.preventDefault()
        try {
            await shareFile({ fileId: shareModal.id, email: shareEmail })
            setShareModal(null)
            setShareEmail('')
            fetchFiles()
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to share file')
        }
    }

    const handleRevoke = async (fileId, email) => {
        try {
            await revokeAccess({ fileId, email })
            fetchFiles()
        } catch (err) {
            setError('Failed to revoke access')
        }
    }

    const verifyOnBlockchain = async (file) => {
        try {
            if (typeof window.ethereum === 'undefined') {
                setVerifyResult({ success: false, message: 'Please install MetaMask' })
                return
            }

            const provider = new ethers.BrowserProvider(window.ethereum)
            const contract = getContract(provider)

            const result = await contract.verifyHash(file.ipfsHash)

            if (result[0]) {
                setVerifyResult({
                    success: true,
                    message: `✓ Verified! Owner: ${result[1].slice(0, 8)}...${result[1].slice(-6)}`,
                    timestamp: new Date(Number(result[2]) * 1000).toLocaleString()
                })
            } else {
                setVerifyResult({ success: false, message: 'File not registered on blockchain' })
            }
        } catch (err) {
            setVerifyResult({ success: false, message: 'Verification failed' })
        }
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
                        <Link to="/dashboard" className="active">My Files</Link>
                        <Link to="/upload">Upload</Link>
                        <Link to="/shared-with-me">Shared with Me</Link>
                        <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <div className="container dashboard">
                <div className="dashboard-header">
                    <h1>My Files</h1>
                    <Link to="/upload" className="btn btn-primary">
                        ➕ Upload File
                    </Link>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {verifyResult && (
                    <div className={`alert ${verifyResult.success ? 'alert-success' : 'alert-error'}`}>
                        {verifyResult.message}
                        {verifyResult.timestamp && <small> • Registered: {verifyResult.timestamp}</small>}
                        <button onClick={() => setVerifyResult(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                    </div>
                )}

                {loading ? (
                    <div className="empty-state">Loading...</div>
                ) : files.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📁</div>
                        <h3>No files yet</h3>
                        <p>Upload your first file to get started</p>
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
                                    <span>📅 {new Date(file.uploadedAt).toLocaleDateString()}</span>
                                    {file.blockchainFileId && <span className="verified-badge">⛓️ On-chain</span>}
                                </div>

                                {file.sharedWith.length > 0 && (
                                    <div>
                                        <small style={{ color: 'var(--text-muted)' }}>Shared with:</small>
                                        <div className="shared-list">
                                            {file.sharedWith.map((email) => (
                                                <span key={email} className="shared-chip">
                                                    {email}
                                                    <button onClick={() => handleRevoke(file.id, email)}>✕</button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="file-actions" style={{ marginTop: '1rem' }}>
                                    <a
                                        href={file.ipfsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-secondary btn-sm"
                                    >
                                        View
                                    </a>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => setShareModal(file)}
                                    >
                                        Share
                                    </button>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => verifyOnBlockchain(file)}
                                    >
                                        Verify
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Share Modal */}
            {shareModal && (
                <div className="modal-backdrop" onClick={() => setShareModal(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Share "{shareModal.name}"</h2>
                        <form onSubmit={handleShare}>
                            <div className="form-group">
                                <label>Recipient Email</label>
                                <input
                                    type="email"
                                    placeholder="Enter email address"
                                    value={shareEmail}
                                    onChange={(e) => setShareEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShareModal(null)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
                                    Share
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}

export default Dashboard
