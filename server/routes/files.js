const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const jwt = require('jsonwebtoken');
const File = require('../models/File');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Multer config - 10MB limit
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        // Optional: Add file type validation
        if (file.size === 0) {
            cb(new Error('File is empty'));
        } else {
            cb(null, true);
        }
    }
});

// Auth middleware with error handling
const auth = (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Input validation helper
const validateEmail = (email) => {
    return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
};

// Upload to Pinata with error handling
async function uploadToPinata(fileBuffer, fileName) {
    if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_KEY) {
        throw new Error('Pinata credentials not configured');
    }

    const formData = new FormData();
    formData.append('file', fileBuffer, { filename: fileName });

    try {
        const response = await axios.post(
            'https://api.pinata.cloud/pinning/pinFileToIPFS',
            formData,
            {
                maxBodyLength: Infinity,
                headers: {
                    ...formData.getHeaders(),
                    pinata_api_key: process.env.PINATA_API_KEY,
                    pinata_secret_api_key: process.env.PINATA_SECRET_KEY
                },
                timeout: 30000
            }
        );

        if (!response.data.IpfsHash) {
            throw new Error('No IPFS hash returned');
        }

        return response.data.IpfsHash;
    } catch (error) {
        throw new Error(`IPFS upload failed: ${error.message}`);
    }
}

// POST /files/upload
router.post('/upload', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        if (req.file.size === 0) {
            return res.status(400).json({ error: 'File is empty' });
        }

        const ipfsHash = await uploadToPinata(req.file.buffer, req.file.originalname);

        const file = new File({
            name: req.file.originalname,
            ipfsHash,
            size: req.file.size,
            mimeType: req.file.mimetype,
            owner: req.userId,
            blockchainFileId: req.body.blockchainFileId || null
        });

        await file.save();

        res.status(201).json({
            message: 'File uploaded successfully',
            file: {
                id: file._id,
                name: file.name,
                ipfsHash: file.ipfsHash,
                size: file.size,
                mimeType: file.mimeType,
                ipfsUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message || 'File upload failed' });
    }
});

// GET /files/my-files
router.get('/my-files', auth, async (req, res) => {
    try {
        const files = await File.find({ owner: req.userId })
            .populate('sharedWith', 'email')
            .sort({ uploadedAt: -1 });

        res.json(files.map(f => ({
            id: f._id,
            name: f.name,
            ipfsHash: f.ipfsHash,
            size: f.size,
            mimeType: f.mimeType,
            sharedWith: f.sharedWith.map(u => u.email),
            blockchainFileId: f.blockchainFileId,
            ipfsUrl: `https://gateway.pinata.cloud/ipfs/${f.ipfsHash}`,
            uploadedAt: f.uploadedAt
        })));
    } catch (error) {
        console.error('Fetch files error:', error);
        res.status(500).json({ error: 'Failed to fetch files' });
    }
});

// GET /files/shared
router.get('/shared', auth, async (req, res) => {
    try {
        const files = await File.find({ sharedWith: req.userId })
            .populate('owner', 'email')
            .sort({ uploadedAt: -1 });

        res.json(files.map(f => ({
            id: f._id,
            name: f.name,
            ipfsHash: f.ipfsHash,
            size: f.size,
            mimeType: f.mimeType,
            owner: f.owner.email,
            ipfsUrl: `https://gateway.pinata.cloud/ipfs/${f.ipfsHash}`,
            uploadedAt: f.uploadedAt
        })));
    } catch (error) {
        console.error('Fetch shared files error:', error);
        res.status(500).json({ error: 'Failed to fetch shared files' });
    }
});

// GET /files/:id - Get single file details
router.get('/:id', auth, async (req, res) => {
    try {
        const file = await File.findOne({
            $or: [
                { _id: req.params.id, owner: req.userId },
                { _id: req.params.id, sharedWith: req.userId }
            ]
        }).populate('owner', 'email walletAddress').populate('sharedWith', 'email walletAddress');

        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.json({
            id: file._id,
            name: file.name,
            ipfsHash: file.ipfsHash,
            size: file.size,
            mimeType: file.mimeType,
            owner: file.owner,
            sharedWith: file.sharedWith,
            blockchainFileId: file.blockchainFileId,
            ipfsUrl: `https://gateway.pinata.cloud/ipfs/${file.ipfsHash}`,
            uploadedAt: file.uploadedAt
        });
    } catch (error) {
        console.error('Fetch file error:', error);
        res.status(500).json({ error: 'Failed to fetch file' });
    }
});

// POST /files/share
router.post('/share', auth, async (req, res) => {
    try {
        const { fileId, email } = req.body;

        if (!fileId || !email) {
            return res.status(400).json({ error: 'File ID and email are required' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const file = await File.findOne({ _id: fileId, owner: req.userId });
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        const targetUser = await User.findOne({ email: email.toLowerCase() });
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (file.sharedWith.includes(targetUser._id)) {
            return res.status(400).json({ error: 'File already shared with this user' });
        }

        file.sharedWith.push(targetUser._id);
        await file.save();

        res.json({ message: 'File shared successfully' });
    } catch (error) {
        console.error('Share error:', error);
        res.status(500).json({ error: 'Failed to share file' });
    }
});

// DELETE /files/:id - Delete a file
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;

        const file = await File.findOne({ _id: id, owner: req.userId });
        if (!file) {
            return res.status(404).json({ error: 'File not found or you do not have permission to delete it' });
        }

        await File.deleteOne({ _id: id });

        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

// DELETE /files/revoke
router.delete('/revoke', auth, async (req, res) => {
    try {
        const { fileId, email } = req.body;

        if (!fileId || !email) {
            return res.status(400).json({ error: 'File ID and email are required' });
        }

        const file = await File.findOne({ _id: fileId, owner: req.userId });
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        const targetUser = await User.findOne({ email: email.toLowerCase() });
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        file.sharedWith = file.sharedWith.filter(id => !id.equals(targetUser._id));
        await file.save();

        res.json({ message: 'Access revoked successfully' });
    } catch (error) {
        console.error('Revoke error:', error);
        res.status(500).json({ error: 'Failed to revoke access' });
    }
});

// PUT /files/blockchain-id
router.put('/blockchain-id', auth, async (req, res) => {
    try {
        const { fileId, blockchainFileId } = req.body;

        if (!fileId || blockchainFileId === undefined) {
            return res.status(400).json({ error: 'File ID and blockchain ID are required' });
        }

        const file = await File.findOneAndUpdate(
            { _id: fileId, owner: req.userId },
            { blockchainFileId },
            { new: true }
        );

        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.json({ message: 'Blockchain ID updated', file });
    } catch (error) {
        console.error('Update blockchain ID error:', error);
        res.status(500).json({ error: 'Failed to update blockchain ID' });
    }
});

// POST /files/blockchain-grant - Grant access on blockchain
router.post('/blockchain-grant', auth, async (req, res) => {
    try {
        const { fileId, walletAddress, transactionHash } = req.body;

        if (!fileId || !walletAddress) {
            return res.status(400).json({ error: 'File ID and wallet address are required' });
        }

        const file = await File.findOne({ _id: fileId, owner: req.userId });
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        if (!file.blockchainFileId) {
            return res.status(400).json({ error: 'File is not registered on blockchain' });
        }

        res.json({
            message: 'Access grant recorded',
            transactionHash,
            fileId: file._id,
            blockchainFileId: file.blockchainFileId,
            walletAddress
        });
    } catch (error) {
        console.error('Grant blockchain access error:', error);
        res.status(500).json({ error: 'Failed to record access grant' });
    }
});

// POST /files/blockchain-revoke - Revoke access on blockchain
router.post('/blockchain-revoke', auth, async (req, res) => {
    try {
        const { fileId, walletAddress, transactionHash } = req.body;

        if (!fileId || !walletAddress) {
            return res.status(400).json({ error: 'File ID and wallet address are required' });
        }

        const file = await File.findOne({ _id: fileId, owner: req.userId });
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        if (!file.blockchainFileId) {
            return res.status(400).json({ error: 'File is not registered on blockchain' });
        }

        res.json({
            message: 'Access revoke recorded',
            transactionHash,
            fileId: file._id,
            blockchainFileId: file.blockchainFileId,
            walletAddress
        });
    } catch (error) {
        console.error('Revoke blockchain access error:', error);
        res.status(500).json({ error: 'Failed to record access revoke' });
    }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'FILE_TOO_LARGE') {
            return res.status(413).json({ error: 'File too large. Maximum size is 10MB' });
        }
        return res.status(400).json({ error: error.message });
    }
    next(error);
});

module.exports = router;
