import express from 'express';
import multer from 'multer';
import { uploadAndAuditCSV, getReportHistory, commitImportedExpenses } from '../controllers/import.controller.js';
import { protect } from '../middleware/auth.middleware.js';

// Setup multer in-memory storage configuration
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Verify file is CSV
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed!'), false);
    }
  }
});

const router = express.Router();

router.use(protect); // Secure import endpoints

router.post('/', upload.single('file'), uploadAndAuditCSV);
router.post('/commit', commitImportedExpenses);
router.get('/reports', getReportHistory);

export default router;
