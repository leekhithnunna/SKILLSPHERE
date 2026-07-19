const path = require('path');
const fs = require('fs');
const { cloudinary, isConfigured } = require('../config/cloudinary');

const LOCAL_UPLOAD_DIR = path.join(__dirname, '../../uploads');

/**
 * Uploads a buffer to Cloudinary if configured, otherwise falls back to
 * writing it to backend/uploads/<folder>/ and returns a local static URL.
 */
const uploadBuffer = async (buffer, { folder = 'misc', filename = 'file', resourceType = 'auto' } = {}) => {
  if (isConfigured) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `skillsphere/${folder}`, resource_type: resourceType },
        (error, result) => {
          if (error) return reject(error);
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );
      stream.end(buffer);
    });
  }

  const targetDir = path.join(LOCAL_UPLOAD_DIR, folder);
  fs.mkdirSync(targetDir, { recursive: true });
  const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  fs.writeFileSync(path.join(targetDir, safeName), buffer);

  return {
    url: `/uploads/${folder}/${safeName}`,
    publicId: null,
  };
};

module.exports = { uploadBuffer };
