import multer from 'multer';

// Use memory storage for audio files (will be sent to Gemini API)
const storage = multer.memoryStorage();

// File filter for audio files
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Accept common audio formats
  const allowedMimes = [
    'audio/mpeg',      // .mp3
    'audio/wav',       // .wav
    'audio/wave',      // .wav
    'audio/x-wav',     // .wav
    'audio/webm',      // .webm
    'audio/ogg',       // .ogg
    'audio/mp4',       // .m4a
    'audio/x-m4a',     // .m4a
    'audio/aac',       // .aac
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only audio files are allowed.`));
  }
};

export const uploadAudio = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max file size
  },
}).single('audio');
