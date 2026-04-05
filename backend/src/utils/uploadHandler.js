const fs = require('fs');
const path = require('path');

/**
 * Delete file from uploads directory
 * @param {string} filename - The filename to delete
 */
const deleteFile = (filename) => {
  try {
    if (!filename) return true;
    
    const filePath = path.join(__dirname, '../../uploads', filename);
    
    // Prevent directory traversal attacks
    const uploadsDir = path.resolve(path.join(__dirname, '../../uploads'));
    if (!path.resolve(filePath).startsWith(uploadsDir)) {
      throw new Error('Invalid file path');
    }
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return true;
  } catch (err) {
    console.error('Error deleting file:', err.message);
    return false;
  }
};

/**
 * Get file URL from filename
 * @param {string} filename - The uploaded filename
 * @returns {string} - URL path to the file
 */
const getFileUrl = (filename) => {
  if (!filename) return '';
  return `/uploads/${filename}`;
};

/**
 * Validate file before processing
 * @param {object} file - Express multer file object
 * @param {object} options - Validation options
 */
const validateFile = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
  } = options;

  if (!file) {
    throw new Error('No file provided');
  }

  if (file.size > maxSize) {
    throw new Error(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
  }

  if (!allowedMimes.includes(file.mimetype)) {
    throw new Error(`File type ${file.mimetype} is not allowed`);
  }

  return true;
};

module.exports = {
  deleteFile,
  getFileUrl,
  validateFile,
};
