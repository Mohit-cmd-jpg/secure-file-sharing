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
    const [successMessage, setSuccessMessage] = useState('')
    const [registerOnChain, setRegisterOnChain] = useState(false)
    const [uploadStage, setUploadStage] = useState('') // '', 'uploading', 'blockchain', 'finalizing'

    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    const ALLOWED_TYPES = ['application/pdf', 'image/*', 'video/*', 'application/msword', 'application/vnd.ms-excel', 'text/plain', 'application/zip']

    const validateFile = (file) => {
        // Check size
        if (file.size > MAX_FILE_SIZE) {
            return { valid: false, error: `File too large. Maximum size is ${formatSize(MAX_FILE_SIZE)}` }
        }

        // Check type
        const isAllowed = ALLOWED_TYPES.some(type => {
            if (type.endsWith('/*')) {
                const baseType = type.replace('/*', '')
                return file.type.startsWith(baseType)
            }
            return file.type === type
        })

        if (!isAllowed && file.type) {
            return { valid: false, error: `File type not supported: ${file.type}` }
        }

        return { valid: true }
    }

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
        const validation = validateFile(file)
        if (!validation.valid) {
            setError(validation.error)
            setSelectedFile(null)
            return
        }
        setError('')
        setSuccessMessage('')
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
        setSuccessMessage('')
        setProgress(10)
        setUploadStage('uploading')

        try {
            // Stage 1: Upload to IPFS
            const formData = new FormData()
            formData.append('file', selectedFile)

            setProgress(40)
            const response = await uploadFile(formData)
            const uploadedFile = response.data.file

            setSuccessMessage(`✓ File uploaded to IPFS`)
            setProgress(50)

            // Stage 2: Register on blockchain if requested
            if (registerOnChain) {
                setUploadStage('blockchain')
                setProgress(60)

                if (typeof window.ethereum === 'undefined') {
                    throw new Error('MetaMask not detected. Please install MetaMask to register on blockchain.')
                }

                setProgress(70)

                // Request account access
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                })

                const provider = new ethers.BrowserProvider(window.ethereum)
                const signer = await provider.getSigner()
                const contract = getContract(signer)

                setProgress(75)

                // Call blockchain addFile
                const tx = await contract.addFile(uploadedFile.ipfsHash)
                setProgress(85)

                // Wait for transaction to be mined
                const receipt = await tx.wait()

                if (!receipt || !receipt.status) {
                    throw new Error('Blockchain transaction failed')
                }

                // Get the file ID from the contract
                const fileCount = await contract.fileCount()

                setProgress(90)

                // Update backend with blockchain ID
                await updateBlockchainId({
                    fileId: uploadedFile.id,
                    blockchainFileId: Number(fileCount)
                })

                setSuccessMessage(`✓ File registered on blockchain (ID: ${fileCount})`)
            }

            setProgress(100)
            setUploadStage('finalizing')
            setSuccessMessage(`✓ File "${selectedFile.name}" uploaded successfully!`)

            setTimeout(() => {
                navigate('/dashboard')
            }, 1500)

        } catch (err) {
            console.error(err)
            const errorMessage = err.message || 'Upload failed. Please try again.'
            setError(errorMessage)
            setProgress(0)
            setUploadStage('')
        } finally {
            setUploading(false)
        }
    }

    const getProgressLabel = () => {
        if (progress === 0) return 'Ready'
        if (progress < 50) return 'Uploading to IPFS...'
        if (progress < 90) return 'Registering on blockchain...'
        return 'Finalizing...'
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
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Max size: {formatSize(MAX_FILE_SIZE)}
                    </p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        {error}
                        <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                    </div>
                )}

                {successMessage && (
                    <div className="alert alert-success">
                        {successMessage}
                        <button onClick={() => setSuccessMessage('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                    </div>
                )}

                <div
                    className={`upload-zone ${dragActive ? 'active' : ''} ${uploading ? 'disabled' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    style={{ cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        disabled={uploading}
                    />

                    <div className="upload-zone-icon">📤</div>

                    {selectedFile && !uploading ? (
                        <>
                            <h3>{selectedFile.name}</h3>
                            <p>{formatSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}</p>
                        </>
                    ) : uploading ? (
                        <>
                            <h3>Processing your file...</h3>
                            <p>{getProgressLabel()}</p>
                        </>
                    ) : (
                        <>
                            <h3>Drop your file here or click to browse</h3>
                            <p>Supported: PDF, Images, Videos, Documents, ZIP</p>
                        </>
                    )}
                </div>

                {progress > 0 && (
                    <div style={{ marginTop: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{getProgressLabel()}</span>
                            <strong>{progress}%</strong>
                        </div>
                        <div className="progress-bar">
                            <div 
                                className="progress-fill" 
                                style={{ width: `${progress}%`, transition: 'width 0.3s ease' }}
                            ></div>
                        </div>
                    </div>
                )}

                {selectedFile && !uploading && (
                    <div style={{ marginTop: '1.5rem' }}>
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={registerOnChain}
                                    onChange={(e) => setRegisterOnChain(e.target.checked)}
                                    style={{ width: 'auto' }}
                                />
                                <span>
                                    <strong>Register on Blockchain</strong>
                                    <br />
                                    <small style={{ color: 'var(--text-muted)' }}>Store file hash on Ethereum for integrity verification (requires MetaMask)</small>
                                </span>
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button
                                className="btn btn-primary"
                                onClick={handleUpload}
                                disabled={uploading}
                                style={{ flex: 1 }}
                            >
                                {uploading ? '⏳ Uploading...' : '📤 Upload File'}
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    setSelectedFile(null)
                                    setProgress(0)
                                    setError('')
                                    setSuccessMessage('')
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
