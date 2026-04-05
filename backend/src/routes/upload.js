const express = require('express');
const path = require('path');
const fs = require('fs');
const { deleteFile, getFileUrl } = require('../utils/uploadHandler');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * POST /api/upload
 * Upload single file
 * Requires: file field in form-data
 */
router.post('/', protect, (req, res) => {
  try {
    // Check if files exist
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const file = req.files.file;

    // Validate file
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedMimes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only images and PDFs are allowed.'
      });
    }

    if (file.size > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 10MB limit'
      });
    }

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.name);
    const name = path.basename(file.name, ext);
    const filename = `${name}-${uniqueSuffix}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    // Move file
    file.mv(filepath, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error uploading file: ' + err.message
        });
      }

      const fileUrl = getFileUrl(filename);
      res.json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          filename,
          url: fileUrl,
          size: file.size,
          mimetype: file.mimetype,
        },
      });
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * POST /api/upload/multiple
 * Upload multiple files
 */
router.post('/multiple', protect, (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No files uploaded' 
      });
    }

    const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    const uploadedFiles = [];
    let completed = 0;

    files.forEach((file, index) => {
      // Validate
      if (!allowedMimes.includes(file.mimetype)) {
        completed++;
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        completed++;
        return;
      }

      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + index + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.name);
      const name = path.basename(file.name, ext);
      const filename = `${name}-${uniqueSuffix}${ext}`;
      const filepath = path.join(uploadsDir, filename);

      // Move file
      file.mv(filepath, (err) => {
        completed++;
        if (!err) {
          uploadedFiles.push({
            filename,
            url: getFileUrl(filename),
            size: file.size,
            mimetype: file.mimetype,
          });
        }

        // Return when all files processed
        if (completed === files.length) {
          if (uploadedFiles.length === 0) {
            return res.status(400).json({
              success: false,
              message: 'Failed to upload files'
            });
          }

          res.json({
            success: true,
            message: `${uploadedFiles.length} file(s) uploaded successfully`,
            data: uploadedFiles,
          });
        }
      });
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * DELETE /api/upload/:filename
 * Delete uploaded file
 */
router.delete('/:filename', protect, (req, res) => {
  try {
    const { filename } = req.params;
    
    // Security check
    if (req.user.role !== 'admin' && !filename.includes(req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this file',
      });
    }

    const deleted = deleteFile(filename);
    
    if (deleted) {
      res.json({
        success: true,
        message: 'File deleted successfully',
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;
