import express from 'express';
import fileUpload from 'express-fileupload';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { initializePinata, testPinataConnection } from '../src/services/pinataService.js';

// Load environment variables
dotenv.config();

// Initialize Pinata
initializePinata({
  apiKey: process.env.PINATA_API_KEY,
  apiSecret: process.env.PINATA_API_SECRET,
});

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
}));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Create storage directory if it doesn't exist
const storageDir = join(__dirname, 'storage');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

// Test Pinata connection on startup
testPinataConnection()
  .then(() => console.log('Successfully connected to Pinata'))
  .catch(error => {
    console.error('Failed to connect to Pinata:', error);
    process.exit(1);
});

// Mock database for access codes
const accessCodes = {};

// Route to upload a document
app.post('/api/upload', (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: 'No files were uploaded' });
    }
    
    const uploadedFile = req.files.document;
    const { recipientName, notes } = req.body;
    
    // Generate access code (6-digit number)
    const accessCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiry time (15 minutes from now)
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 15);
    
    // Save file (in a real app, this would be encrypted and stored on IPFS)
    const filename = `${Date.now()}_${uploadedFile.name}`;
    const filePath = join(storageDir, filename);
    
    uploadedFile.mv(filePath, (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Store access code info
      accessCodes[accessCode] = {
        filePath,
        fileName: uploadedFile.name,
        mimeType: uploadedFile.mimetype,
        expiryTime: expiryTime.toISOString(),
        recipientName,
        notes,
        used: false,
      };
      
      // Return access code and expiry time
      res.json({
        success: true,
        accessCode,
        expiryTime: expiryTime.toISOString(),
      });
      
      // In a real app, we would log this to the blockchain or audit trail
      console.log(`Document uploaded with access code: ${accessCode}`);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to access a document
app.post('/api/access', (req, res) => {
  try {
    const { accessCode } = req.body;
    
    if (!accessCode) {
      return res.status(400).json({ error: 'Access code is required' });
    }
    
    // Check if access code exists
    if (!accessCodes[accessCode]) {
      return res.status(404).json({ error: 'Invalid access code' });
    }
    
    const documentInfo = accessCodes[accessCode];
    
    // Check if document has expired
    if (new Date(documentInfo.expiryTime) < new Date()) {
      return res.status(400).json({ error: 'This document has expired' });
    }
    
    // Check if document has already been used
    if (documentInfo.used) {
      return res.status(400).json({ error: 'This document has already been accessed' });
    }
    
    // Mark as used
    documentInfo.used = true;
    
    // Return file path for download
    res.json({
      success: true,
      fileName: documentInfo.fileName,
      mimeType: documentInfo.mimeType,
      filePath: documentInfo.filePath,
    });
    
    // In a real app, we would log this to the blockchain or audit trail
    console.log(`Document accessed with access code: ${accessCode}`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to download a document
app.get('/api/document/:accessCode', (req, res) => {
  try {
    const { accessCode } = req.params;
    
    // Check if access code exists and has been accessed
    if (!accessCodes[accessCode] || !accessCodes[accessCode].used) {
      return res.status(404).json({ error: 'Document not found or not yet accessed' });
    }
    
    const documentInfo = accessCodes[accessCode];
    
    // Send the file
    res.setHeader('Content-Type', documentInfo.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${documentInfo.fileName}"`);
    
    const fileStream = fs.createReadStream(documentInfo.filePath);
    fileStream.pipe(res);
    
    // In a real app, we would log this to the blockchain or audit trail
    console.log(`Document downloaded with access code: ${accessCode}`);
    
    // Schedule deletion after download
    setTimeout(() => {
      try {
        fs.unlinkSync(documentInfo.filePath);
        delete accessCodes[accessCode];
        console.log(`Document and access code deleted: ${accessCode}`);
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }, 60000); // Delete after 1 minute
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});