const multer = require('multer');

const storage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) return cb(null, true);
  cb(new Error('Only image files are allowed'));
};

const documentFilter = (req, file, cb) => {
  const allowed = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Unsupported file type'));
};

const anyFileFilter = (req, file, cb) => cb(null, true);

const uploadImage = multer({ storage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadDocument = multer({ storage, fileFilter: documentFilter, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadAny = multer({ storage, fileFilter: anyFileFilter, limits: { fileSize: 15 * 1024 * 1024 } });

module.exports = { uploadImage, uploadDocument, uploadAny };
