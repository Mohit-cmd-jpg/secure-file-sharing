import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ethers } from 'ethers'
import { uploadFile, updateBlockchainId } from '../services/api'
import { getContract } from '../services/contract'

function Upload() {
    const navigate = useNavigate()
    const fileInputRef = useRef(null)
    const [selectedFile, setSelectedFile] = useState(null)
    const [dragActive, setDragActive] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState('')
    const [registerOnChain, setRegisterOnChain] = useState(false)

    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        const files = e.dataTransfer.files
        if (files && files[0]) {
            validateAndSetFile(files[0])
        }
    }

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0])
        }
    }

    const validateAndSetFile = (file) => {
        const maxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
            setError('File size must be less than 10MB')
            return
        }
        setError('')
        setSelectedFile(file)
    }

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    const handleUpload = async () => {
        if (!selectedFile) return

        setUploading(true)
        setError('')
        setProgress(10)

        try {
            // Upload to backend (which uploads to IPFS)
            const formData = new FormData()
            formData.append('file', selectedFile)

            setProgress(30)
            const response = await uploadFile(formData)
            setProgress(60)

            const uploadedFile = response.data.file

            // Register on blockchain if requested
            if (registerOnChain) {
                if (typeof window.ethereum === 'undefined') {
                    throw new Error('Please install MetaMask to register on blockchain')
                }

                setProgress(70)
                const provider = new ethers.BrowserProvider(window.ethereum)
                const signer = await provider.getSigner()
                const contract = getContract(signer)

                setProgress(80)
                const tx = await contract.addFile(uploadedFile.ipfsHash)
                await tx.wait()

                // Get the file ID from the contract
                const fileCount = await contract.fileCount()

                // Update backend with blockchain ID
                await updateBlockchainId({
                    fileId: uploadedFile.id,
                    blockchainFileId: Number(fileCount)
                })
            }

            setProgress(100)

            setTimeout(() => {
                navigate('/dashboard')
            }, 500)

        } catch (err) {
            console.error(err)
            setError(err.message || 'Upload failed')
            setProgress(0)
        } finally {
            setUploading(false)
        }
    }

    return (
        <>
            <nav className="navbar">
                <div className="container navbar-content">
                    <span className="navbar-brand">🔒 SecureShare</span>
                    <div className="navbar-links">
                        <Link to="/dashboard">My Files</Link>
                        <Link to="/upload" className="active">Upload</Link>
                        <Link to="/shared-with-me">Shared with Me</Link>
                    </div>
                </div>
            </nav>

            <div className="container dashboard">
                <div className="dashboard-header">
                    <h1>Upload File</h1>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <div
                    className={`upload-zone ${dragActive ? 'active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />

                    <div className="upload-zone-icon">📤</div>

                    {selectedFile ? (
                        <>
                            <h3>{selectedFile.name}</h3>
                            <p>{formatSize(selectedFile.size)}</p>
                        </>
                    ) : (
                        <>
                            <h3>Drop your file here or click to browse</h3>
                            <p>Maximum file size: 10MB</p>
                        </>
                    )}
                </div>

                {selectedFile && (
                    <div style={{ marginTop: '1.5rem' }}>
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={registerOnChain}
                                    onChange={(e) => setRegisterOnChain(e.target.checked)}
                                    style={{ width: 'auto' }}
                                />
                                Register file hash on blockchain (requires MetaMask)
                            </label>
                        </div>

                        {progress > 0 && (
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button
                                className="btn btn-primary"
                                onClick={handleUpload}
                                disabled={uploading}
                                style={{ flex: 1 }}
                            >
                                {uploading ? 'Uploading...' : 'Upload File'}
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    setSelectedFile(null)
                                    setProgress(0)
                                }}
                                disabled={uploading}
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

export default Upload
