// Import Controller
import { parseCSV } from '../services/import.service.js';
import { scanForAnomalies } from '../services/anomaly.service.js';

// @desc    Upload expense CSV & generate validation report
// @route   POST /api/import
// @access  Private
export const uploadAndAuditCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded. Please upload a CSV file.' });
    }

    // Convert file buffer to string
    const csvContent = req.file.buffer.toString('utf-8');

    // 1. Parse CSV
    const { data: parsedExpenses, errors: parseErrors } = parseCSV(csvContent);

    if (parsedExpenses.length === 0 && parseErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to parse CSV file. See errors for details.',
        errors: parseErrors
      });
    }

    // 2. Scan for anomalies
    const anomalies = scanForAnomalies(parsedExpenses);

    // 3. Compile report metrics
    const totalProcessed = parsedExpenses.length;
    const totalAmount = parsedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const anomalyCount = anomalies.length;

    // Calculate dynamic risk score (0 to 100)
    let riskScore = 0;
    anomalies.forEach(a => {
      if (a.severity === 'HIGH') riskScore += 25;
      else if (a.severity === 'MEDIUM') riskScore += 10;
      else riskScore += 5;
    });
    riskScore = Math.min(riskScore, 100);

    res.status(200).json({
      success: true,
      message: 'CSV parsed and audited successfully',
      report: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        totalProcessed,
        totalAmount,
        anomalyCount,
        riskScore,
        expenses: parsedExpenses,
        anomalies,
        parseErrors
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get import audit report history (Mock logs)
// @route   GET /api/import/reports
// @access  Private
export const getReportHistory = async (req, res, next) => {
  try {
    // Return mock historical report statistics
    res.status(200).json({
      success: true,
      data: [
        {
          id: 'report-1',
          fileName: 'june_groceries.csv',
          uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          totalProcessed: 12,
          totalAmount: 450.50,
          anomalyCount: 2,
          riskScore: 20
        },
        {
          id: 'report-2',
          fileName: 'paris_trip_raw.csv',
          uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          totalProcessed: 25,
          totalAmount: 1800.00,
          anomalyCount: 5,
          riskScore: 65
        }
      ]
    });
  } catch (error) {
    next(error);
  }
};
