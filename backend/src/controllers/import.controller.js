// Import Controller
import prisma from '../services/prisma.service.js';
import { parseCSV } from '../services/import.service.js';
import { scanForAnomalies } from '../services/anomaly.service.js';
import { logActivity } from '../services/activity.service.js';

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
    const anomalies = await scanForAnomalies(parsedExpenses);

    // 3. Compile report metrics
    const totalProcessed = parsedExpenses.length;
    const totalAmount = parsedExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
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

// @desc    Commit valid parsed expenses from import preview
// @route   POST /api/import/commit
// @access  Private
export const commitImportedExpenses = async (req, res, next) => {
  try {
    const { expenses } = req.body;
    if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
      return res.status(400).json({ success: false, error: 'No expenses provided to commit.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      let commitCount = 0;

      for (const expense of expenses) {
        const { description, amount, date, groupId, paidById } = expense;

        if (!description || !groupId) {
          continue; // Skip invalid lines without essential fields
        }

        // Verify group exists
        const group = await tx.group.findUnique({
          where: { id: groupId }
        });
        if (!group) {
          continue; // Skip expense for non-existent group
        }

        // Get active group members (leftAt is null)
        const members = await tx.groupMember.findMany({
          where: {
            groupId,
            leftAt: null
          }
        });

        if (members.length === 0) {
          continue; // Skip if no active members to share the split
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          continue; // Skip invalid amount
        }

        // Resolve payer
        let actualPayerId = paidById;
        if (actualPayerId) {
          const payerExists = await tx.user.findUnique({ where: { id: actualPayerId } });
          if (!payerExists) {
            actualPayerId = req.user.id;
          }
        } else {
          actualPayerId = req.user.id;
        }

        // Calculate equal split amounts
        const N = members.length;
        const baseSplit = Math.floor((parsedAmount / N) * 100) / 100;
        let remaining = Math.round((parsedAmount - baseSplit * N) * 100) / 100;

        const computedSplits = members.map((m, idx) => {
          let splitAmt = baseSplit;
          if (idx < Math.round(remaining * 100)) {
            splitAmt += 0.01;
          }
          return {
            userId: m.userId,
            amount: splitAmt
          };
        });

        // Create the expense record
        const createdExpense = await tx.expense.create({
          data: {
            description: description.trim(),
            amount: parsedAmount,
            currency: expense.currency || 'USD',
            date: date ? new Date(date) : new Date(),
            groupId,
            paidById: actualPayerId,
            splitType: 'EQUAL'
          }
        });

        // Create the split records
        const splitData = computedSplits.map(s => ({
          expenseId: createdExpense.id,
          userId: s.userId,
          amount: s.amount
        }));

        await tx.expenseSplit.createMany({
          data: splitData
        });

        commitCount++;
      }

      return { count: commitCount };
    });

    res.status(200).json({
      success: true,
      message: `Successfully imported ${result.count} expenses.`,
      count: result.count
    });

    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { name: true }
      });
      await logActivity({
        type: 'CSV_IMPORTED',
        userId: req.user.id,
        userName: user?.name,
        message: `${user?.name || 'Someone'} imported ${result.count} expenses from CSV spreadsheet.`,
        details: { count: result.count }
      });
    } catch (logError) {
      console.error('Failed to log CSV import activity:', logError);
    }
  } catch (error) {
    next(error);
  }
};
