const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const uploadDir = process.env.MEDIA_UPLOAD_PATH || './uploads/media';

// Create upload directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `media-${uniqueId}${ext}`);
  }
});

// Allowed file types
const ALLOWED_IMAGE_TYPES = /jpeg|jpg|png|gif|webp/;
const ALLOWED_VIDEO_TYPES = /mp4|mov|webm|avi|mkv|quicktime/;

const fileFilter = (req, file, cb) => {
  const extname = ALLOWED_IMAGE_TYPES.test(path.extname(file.originalname).toLowerCase()) ||
                  ALLOWED_VIDEO_TYPES.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image (JPEG, PNG, GIF, WebP) and video (MP4, MOV, WebM, AVI, MKV) files are allowed'));
  }
};

const uploadMedia = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  fileFilter: fileFilter
});

module.exports = uploadMedia;
