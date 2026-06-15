import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getAllUserExpenses, importCSV, importPreview } from '../controllers/expense.controller.js';
import { validateImportCSV, commitCleanImport, getImportSuggestions } from '../controllers/importValidator.controller.js';
import { protect } from '../middleware/auth.middleware.js';

// Ensure uploads folder exists in the project workspace
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Setup Multer disk storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (fileExtension === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed!'), false);
    }
  }
});

const router = express.Router();

router.use(protect); // Secure with JWT authorization

router.route('/')
  .get(getAllUserExpenses);

// CSV Import API (Accepts CSV, parses, returns count, cleans up disk, doesn't persist to database)
router.post('/import', upload.single('file'), importCSV);

// CSV Import Preview API (Accepts CSV, parses and returns full valid/invalid JSON preview rows, cleans up disk, doesn't persist to database)
router.post('/import/preview', upload.single('file'), importPreview);

// CSV Import Validation with issues, duplicate detection, and AI analysis
router.post('/import/validate', upload.single('file'), validateImportCSV);

// Fetch AI resolution suggestions
router.post('/import/resolve-suggestions', getImportSuggestions);

// Commit cleaned CSV import data (guest creations, conversions to settlements, resolving duplicates, splits calculation)
router.post('/import/commit-clean', commitCleanImport);

export default router;
