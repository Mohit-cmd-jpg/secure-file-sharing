import { useEffect, useState } from 'react'

function FilePreviewModal({ file, isOpen, onClose }) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [preview, setPreview] = useState(null)

    useEffect(() => {
        if (!isOpen || !file) {
            setLoading(true)
            setError('')
            setPreview(null)
            return
        }

        loadPreview()
    }, [isOpen, file])

    const loadPreview = async () => {
        setLoading(true)
        setError('')

        try {
            const mimeType = file.mimeType || ''
            const fileName = file.name.toLowerCase()

            // Image files - can be shown inline
            if (mimeType.startsWith('image/')) {
                setPreview({
                    type: 'image',
                    url: file.ipfsUrl
                })
            }
            // Video files - HTML5 player
            else if (mimeType.startsWith('video/')) {
                setPreview({
                    type: 'video',
                    url: file.ipfsUrl
                })
            }
            // PDF files - show message to download
            else if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
                setPreview({
                    type: 'pdf'
                })
            }
            // Text files - fetch and show content
            else if (mimeType.startsWith('text/') || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
                const response = await fetch(file.ipfsUrl)
                if (!response.ok) throw new Error('Failed to load file')
                const text = await response.text()
                setPreview({
                    type: 'text',
                    content: text.substring(0, 5000) // Limit to 5000 chars
                })
            }
            // Default - unsupported preview
            else {
                setPreview({
                    type: 'unsupported'
                })
            }
        } catch (err) {
            setError('Failed to load preview: ' + err.message)
            setPreview({
                type: 'error'
            })
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2>{file.name}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '1.5rem' }}>✕</button>
                </div>

                {error && (
                    <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                {loading && (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                        <p>Loading preview...</p>
                    </div>
                )}

                {!loading && preview && (
                    <>
                        {preview.type === 'image' && (
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <img
                                    src={preview.url}
                                    alt={file.name}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '400px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)'
                                    }}
                                />
                            </div>
                        )}

                        {preview.type === 'video' && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <video
                                    controls
                                    style={{
                                        width: '100%',
                                        maxHeight: '400px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)',
                                        background: 'var(--background)'
                                    }}
                                >
                                    <source src={preview.url} type={file.mimeType} />
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                        )}

                        {preview.type === 'text' && (
                            <pre style={{
                                background: 'var(--background)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                padding: '1rem',
                                overflow: 'auto',
                                maxHeight: '400px',
                                fontSize: '0.875rem',
                                lineHeight: '1.4',
                                marginBottom: '1.5rem'
                            }}>
                                {preview.content}
                            </pre>
                        )}

                        {preview.type === 'pdf' && (
                            <div style={{
                                background: 'var(--background)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                padding: '2rem',
                                textAlign: 'center',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                    PDF preview is not available. Please download to view.
                                </p>
                            </div>
                        )}

                        {preview.type === 'unsupported' && (
                            <div style={{
                                background: 'var(--background)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                padding: '2rem',
                                textAlign: 'center',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                    Preview not available for this file type. Download to view.
                                </p>
                            </div>
                        )}

                        <div style={{
                            display: 'flex',
                            gap: '1rem',
                            justifyContent: 'space-between',
                            padding: '1rem',
                            background: 'var(--surface-light)',
                            borderRadius: '8px',
                            marginBottom: '1rem'
                        }}>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                <p>📊 {formatSize(file.size)}</p>
                                <p>📅 {new Date(file.uploadedAt).toLocaleDateString()}</p>
                            </div>

                        </div>
                    </>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <a
                        href={file.ipfsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                        style={{ flex: 1, textDecoration: 'none', textAlign: 'center' }}
                    >
                        📥 Download
                    </a>
                    <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default FilePreviewModal
export { formatSize }
