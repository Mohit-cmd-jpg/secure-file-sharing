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
    limits: { fileSize: 10 * 1024 * 1024 }
});

// Auth middleware
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
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Upload to Pinata
async function uploadToPinata(fileBuffer, fileName) {
    const formData = new FormData();
    formData.append('file', fileBuffer, { filename: fileName });

    const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
            maxBodyLength: Infinity,
            headers: {
                ...formData.getHeaders(),
                pinata_api_key: process.env.PINATA_API_KEY,
                pinata_secret_api_key: process.env.PINATA_SECRET_KEY
            }
        }
    );

    return response.data.IpfsHash;
}

// POST /files/upload
router.post('/upload', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
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
                ipfsUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'File upload failed' });
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
        res.status(500).json({ error: 'Failed to fetch shared files' });
    }
});

// POST /files/share
router.post('/share', auth, async (req, res) => {
    try {
        const { fileId, email } = req.body;

        const file = await File.findOne({ _id: fileId, owner: req.userId });
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        const targetUser = await User.findOne({ email });
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (file.sharedWith.includes(targetUser._id)) {
            return res.status(400).json({ error: 'Already shared with this user' });
        }

        file.sharedWith.push(targetUser._id);
        await file.save();

        res.json({ message: 'File shared successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to share file' });
    }
});

// DELETE /files/revoke
router.delete('/revoke', auth, async (req, res) => {
    try {
        const { fileId, email } = req.body;

        const file = await File.findOne({ _id: fileId, owner: req.userId });
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        const targetUser = await User.findOne({ email });
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        file.sharedWith = file.sharedWith.filter(id => !id.equals(targetUser._id));
        await file.save();

        res.json({ message: 'Access revoked successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to revoke access' });
    }
});

// PUT /files/blockchain-id
router.put('/blockchain-id', auth, async (req, res) => {
    try {
        const { fileId, blockchainFileId } = req.body;

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
        res.status(500).json({ error: 'Failed to update blockchain ID' });
    }
});

module.exports = router;
