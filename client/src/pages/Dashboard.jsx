import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ethers } from 'ethers'
import { getMyFiles, shareFile, revokeAccess, grantBlockchainAccess, revokeBlockchainAccess } from '../services/api'
import { getContract } from '../services/contract'
import FilePreviewModal from '../components/FilePreviewModal'

function Dashboard() {
    const navigate = useNavigate()
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [shareModal, setShareModal] = useState(null)
    const [shareEmail, setShareEmail] = useState('')
    const [grantModal, setGrantModal] = useState(null)
    const [grantWallet, setGrantWallet] = useState('')
    const [previewModal, setPreviewModal] = useState(null)
    const [verifyResult, setVerifyResult] = useState(null)
    const [sharing, setSharing] = useState(false)
    const [granting, setGranting] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('all') // all, onchain, offchain

    const user = JSON.parse(localStorage.getItem('user') || '{}')

    useEffect(() => {
        fetchFiles()
    }, [])

    const fetchFiles = async () => {
        try {
            setLoading(true)
            const response = await getMyFiles()
            setFiles(response.data)
            setError('')
        } catch (err) {
            setError('Failed to fetch files')
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

    // Validation helpers
    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }

    const validateWalletAddress = (address) => {
        return /^0x[a-fA-F0-9]{40}$/.test(address)
    }

    const handleShare = async (e) => {
        e.preventDefault()
        
        if (!validateEmail(shareEmail)) {
            setError('Please enter a valid email address')
            return
        }

        setSharing(true)
        try {
            await shareFile({ fileId: shareModal.id, email: shareEmail })
            setShareModal(null)
            setShareEmail('')
            setError('')
            await fetchFiles()
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to share file')
        } finally {
            setSharing(false)
        }
    }

    const handleRevoke = async (fileId, email) => {
        if (!window.confirm(`Revoke access for ${email}?`)) return

        try {
            await revokeAccess({ fileId, email })
            await fetchFiles()
        } catch (err) {
            setError('Failed to revoke access')
        }
    }

    const handleGrantBlockchainAccess = async (e) => {
        e.preventDefault()

        if (!validateWalletAddress(grantWallet)) {
            setError('Please enter a valid Ethereum wallet address (0x...)')
            return
        }

        if (!grantModal.blockchainFileId) {
            setError('This file is not registered on blockchain')
            return
        }

        setGranting(true)
        try {
            if (typeof window.ethereum === 'undefined') {
                throw new Error('Please install MetaMask')
            }

            const provider = new ethers.BrowserProvider(window.ethereum)
            const signer = await provider.getSigner()
            const contract = getContract(signer)

            // Call blockchain grantAccess
            const tx = await contract.grantAccess(grantModal.blockchainFileId, grantWallet)
            const receipt = await tx.wait()

            // Record on backend
            await grantBlockchainAccess({
                fileId: grantModal.id,
                walletAddress: grantWallet,
                transactionHash: receipt.hash
            })

            setGrantModal(null)
            setGrantWallet('')
            setError('')
            await fetchFiles()
        } catch (err) {
            setError(err.message || 'Failed to grant blockchain access')
        } finally {
            setGranting(false)
        }
    }

    const handleRevokeBlockchainAccess = async (walletAddress) => {
        if (!window.confirm(`Revoke blockchain access for ${walletAddress}?`)) return

        const file = shareModal || grantModal
        if (!file?.blockchainFileId) {
            setError('This file is not registered on blockchain')
            return
        }

        setGranting(true)
        try {
            if (typeof window.ethereum === 'undefined') {
                throw new Error('Please install MetaMask')
            }

            const provider = new ethers.BrowserProvider(window.ethereum)
            const signer = await provider.getSigner()
            const contract = getContract(signer)

            const tx = await contract.revokeAccess(file.blockchainFileId, walletAddress)
            const receipt = await tx.wait()

            await revokeBlockchainAccess({
                fileId: file.id,
                walletAddress,
                transactionHash: receipt.hash
            })

            setGrantModal(null)
            setGrantWallet('')
            setError('')
            await fetchFiles()
        } catch (err) {
            setError(err.message || 'Failed to revoke blockchain access')
        } finally {
            setGranting(false)
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
                    message: `✓ Verified!`,
                    owner: result[1],
                    timestamp: new Date(Number(result[2]) * 1000).toLocaleString()
                })
            } else {
                setVerifyResult({ success: false, message: 'File not registered on blockchain' })
            }
        } catch (err) {
            setVerifyResult({ success: false, message: 'Verification failed: ' + err.message })
        }
    }

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    // Filter and search
    const filteredFiles = files.filter(file => {
        const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesFilter = filterType === 'all' || 
                             (filterType === 'onchain' && file.blockchainFileId) || 
                             (filterType === 'offchain' && !file.blockchainFileId)
        return matchesSearch && matchesFilter
    })

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
                    <div>
                        <h1>My Files</h1>
                        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <Link to="/upload" className="btn btn-primary">
                        ➕ Upload File
                    </Link>
                </div>

                {error && (
                    <div className="alert alert-error">
                        {error}
                        <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                    </div>
                )}

                {verifyResult && (
                    <div className={`alert ${verifyResult.success ? 'alert-success' : 'alert-error'}`}>
                        <div>
                            <strong>{verifyResult.message}</strong>
                            {verifyResult.timestamp && <p style={{ marginTop: '0.5rem' }}>📅 {verifyResult.timestamp}</p>}
                            {verifyResult.owner && <p style={{ marginTop: '0.25rem', fontSize: '0.9rem', wordBreak: 'break-all' }}>👤 {verifyResult.owner}</p>}
                        </div>
                        <button onClick={() => setVerifyResult(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                    </div>
                )}

                {/* Search and Filter */}
                {files.length > 0 && (
                    <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            placeholder="🔍 Search files..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ flex: 1, minWidth: '250px', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                        />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                        >
                            <option value="all">All Files</option>
                            <option value="onchain">On Blockchain ⛓️</option>
                            <option value="offchain">Local Only 💾</option>
                        </select>
                    </div>
                )}

                {loading ? (
                    <div className="empty-state">
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                        <p>Loading your files...</p>
                    </div>
                ) : filteredFiles.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📁</div>
                        <h3>{files.length === 0 ? 'No files yet' : 'No matching files'}</h3>
                        <p>{files.length === 0 ? 'Upload your first file to get started' : 'Try adjusting your search or filters'}</p>
                    </div>
                ) : (
                    <div className="files-grid">
                        {filteredFiles.map((file) => (
                            <div key={file.id} className="file-card">
                                <div className="file-card-header">
                                    <div className="file-icon">📄</div>
                                    <div className="file-info">
                                        <h3 title={file.name}>{file.name}</h3>
                                        <p>{formatSize(file.size)}</p>
                                    </div>
                                </div>

                                <div className="file-meta">
                                    <span>📅 {new Date(file.uploadedAt).toLocaleDateString()}</span>
                                    {file.blockchainFileId ? (
                                        <span className="verified-badge" title={`Blockchain File ID: ${file.blockchainFileId}`}>⛓️ On-chain #{file.blockchainFileId}</span>
                                    ) : (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>💾 Local</span>
                                    )}
                                </div>

                                {file.sharedWith.length > 0 && (
                                    <div style={{ marginTop: '0.75rem' }}>
                                        <small style={{ color: 'var(--text-muted)' }}>Shared with ({file.sharedWith.length}):</small>
                                        <div className="shared-list" style={{ marginTop: '0.5rem' }}>
                                            {file.sharedWith.map((email) => (
                                                <span key={email} className="shared-chip">
                                                    {email}
                                                    <button 
                                                        onClick={() => handleRevoke(file.id, email)}
                                                        style={{ marginLeft: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                                                        title="Revoke access"
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="file-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <a
                                        href={file.ipfsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-secondary btn-sm"
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
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => setShareModal(file)}
                                        title="Share via email"
                                    >
                                        Share
                                    </button>
                                    {file.blockchainFileId && (
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => setGrantModal(file)}
                                            title="Grant blockchain access"
                                        >
                                            Grant 🔐
                                        </button>
                                    )}
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => verifyOnBlockchain(file)}
                                        title="Verify file on blockchain"
                                    >
                                        Verify
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Share Modal - Email sharing */}
            {shareModal && (
                <div className="modal-backdrop" onClick={() => { setShareModal(null); setError(''); }}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Share with Email</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Share "{shareModal.name}" via email</p>
                        <form onSubmit={handleShare}>
                            <div className="form-group">
                                <label>Recipient Email</label>
                                <input
                                    type="email"
                                    placeholder="user@example.com"
                                    value={shareEmail}
                                    onChange={(e) => setShareEmail(e.target.value)}
                                    disabled={sharing}
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => { setShareModal(null); setShareEmail(''); }}
                                    disabled={sharing}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary" 
                                    style={{ width: 'auto' }}
                                    disabled={sharing}
                                >
                                    {sharing ? '⏳ Sharing...' : 'Share'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Grant Blockchain Access Modal */}
            {grantModal && (
                <div className="modal-backdrop" onClick={() => { setGrantModal(null); setError(''); }}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Grant Blockchain Access</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                            Grant access to "{grantModal.name}" on blockchain
                        </p>
                        <form onSubmit={handleGrantBlockchainAccess}>
                            <div className="form-group">
                                <label>Wallet Address</label>
                                <input
                                    type="text"
                                    placeholder="0x..."
                                    value={grantWallet}
                                    onChange={(e) => setGrantWallet(e.target.value)}
                                    disabled={granting}
                                    required
                                />
                                <small style={{ color: 'var(--text-muted)' }}>Enter Ethereum wallet address (0x...)</small>
                            </div>
                            <div className="modal-actions">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => { setGrantModal(null); setGrantWallet(''); }}
                                    disabled={granting}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary" 
                                    style={{ width: 'auto' }}
                                    disabled={granting}
                                >
                                    {granting ? '⏳ Granting...' : 'Grant Access'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* File Preview Modal */}
            <FilePreviewModal 
                file={previewModal} 
                isOpen={!!previewModal} 
                onClose={() => setPreviewModal(null)} 
            />
        </>
    )
}

export default Dashboard
