import fs from 'fs';
import prisma from '../services/prisma.service.js';
import { runCSVValidation, parseSplitDetails } from '../services/csvValidator.service.js';
import { getGroupContext } from '../services/aiAgent.service.js';
import { generateAiImportAnalysis } from '../services/aiImportAnalysis.service.js';
import { logActivity } from '../services/activity.service.js';
import { generateResolutionSuggestions } from '../services/aiResolution.service.js';

/**
 * @desc    Validate uploaded CSV and return detailed report + AI insights
 * @route   POST /api/expenses/import/validate
 * @access  Private
 */
export const validateImportCSV = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded. Please upload a CSV file.' });
  }

  const { groupId } = req.body;
  const filePath = req.file.path;

  if (!groupId) {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) {}
    return res.status(400).json({ success: false, error: 'Group ID is required.' });
  }

  try {
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found.' });
    }

    // Load active group members
    const groupMembers = await prisma.groupMember.findMany({
      where: { groupId, leftAt: null },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    // Load existing expenses
    const existingExpenses = await prisma.expense.findMany({
      where: { groupId }
    });

    const currencies = new Set(existingExpenses.map(e => e.currency));
    const defaultCurrency = existingExpenses[0]?.currency || 'USD';

    const csvContent = fs.readFileSync(filePath, 'utf-8');
    const validationReport = runCSVValidation(csvContent, groupMembers, existingExpenses, defaultCurrency);

    // Run AI analysis
    const groupContext = await getGroupContext(groupId);
    const aiAnalysis = await generateAiImportAnalysis(validationReport, groupContext);
    
    // Generate AI Suggestions
    let aiSuggestions = [];
    try {
      const suggestionsRes = await generateResolutionSuggestions(validationReport, groupMembers, defaultCurrency);
      aiSuggestions = suggestionsRes.suggestions || [];
    } catch (err) {
      console.error('Failed to generate suggestions during CSV validation:', err);
    }

    // Log validation completion activity
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { name: true }
      });
      await logActivity({
        type: 'VALIDATION_COMPLETED',
        userId: req.user.id,
        userName: user?.name,
        groupId,
        groupName: group.name,
        message: `${user?.name || 'Someone'} completed CSV validation with ${validationReport.summary.validCount} valid rows in group "${group.name}"`,
        details: {
          totalRows: validationReport.summary.totalRows,
          validCount: validationReport.summary.validCount,
          warningCount: validationReport.summary.warningCount,
          reviewCount: validationReport.summary.reviewCount,
          rejectedCount: validationReport.summary.rejectedCount
        }
      });

      // Log specific compliance warnings
      for (const row of validationReport.rows) {
        if (row.issues && Array.isArray(row.issues)) {
          for (const issue of row.issues) {
            if (issue.type === 'REFUND_DETECTED') {
              await logActivity({
                type: 'REFUND_DETECTED',
                userId: req.user.id,
                userName: user?.name,
                groupId,
                groupName: group.name,
                message: `Refund of ${row.record?.currency || 'USD'} ${row.record?.amount || 0} detected on Row ${row.rowNumber} ("${row.record?.description}")`,
                details: { rowNumber: row.rowNumber, amount: row.record?.amount }
              });
            } else if (issue.type === 'DUPLICATE_CONFIRMED') {
              await logActivity({
                type: 'DUPLICATE_CONFIRMED',
                userId: req.user.id,
                userName: user?.name,
                groupId,
                groupName: group.name,
                message: `Confirmed duplicate detected on Row ${row.rowNumber} ("${row.record?.description}")`,
                details: { rowNumber: row.rowNumber, description: row.record?.description }
              });
            } else if (issue.type === 'POSSIBLE_DUPLICATE') {
              await logActivity({
                type: 'POSSIBLE_DUPLICATE',
                userId: req.user.id,
                userName: user?.name,
                groupId,
                groupName: group.name,
                message: `Possible duplicate detected on Row ${row.rowNumber} ("${row.record?.description}")`,
                details: { rowNumber: row.rowNumber, description: row.record?.description }
              });
            } else if (issue.type === 'UNKNOWN_PAYER') {
              await logActivity({
                type: 'UNKNOWN_PAYER',
                userId: req.user.id,
                userName: user?.name,
                groupId,
                groupName: group.name,
                message: `Unknown payer on Row ${row.rowNumber} ("${row.record?.description}"): ${row.record?.paidBy || 'N/A'}`,
                details: { rowNumber: row.rowNumber, paidBy: row.record?.paidBy }
              });
            } else if (issue.type === 'FUTURE_DATE') {
              await logActivity({
                type: 'FUTURE_DATE',
                userId: req.user.id,
                userName: user?.name,
                groupId,
                groupName: group.name,
                message: `Future date detected on Row ${row.rowNumber} ("${row.record?.description}"): ${row.record?.date}`,
                details: { rowNumber: row.rowNumber, date: row.record?.date }
              });
            } else if (issue.type === 'MULTI_CURRENCY_IMPORT') {
              await logActivity({
                type: 'MULTI_CURRENCY_IMPORT',
                userId: req.user.id,
                userName: user?.name,
                groupId,
                groupName: group.name,
                message: `Multi-currency row detected on Row ${row.rowNumber} ("${row.record?.description}"): ${row.record?.currency}`,
                details: { rowNumber: row.rowNumber, currency: row.record?.currency }
              });
            } else if (issue.type === 'PARTICIPANTS_MISSING') {
              await logActivity({
                type: 'PARTICIPANTS_MISSING',
                userId: req.user.id,
                userName: user?.name,
                groupId,
                groupName: group.name,
                message: `Participant splits missing on Row ${row.rowNumber} ("${row.record?.description}")`,
                details: { rowNumber: row.rowNumber, description: row.record?.description }
              });
            }
          }
        }
      }
    } catch (logError) {
      console.error('Failed to log CSV validation activity:', logError);
    }

    res.status(200).json({
      success: true,
      report: validationReport,
      aiAnalysis,
      aiSuggestions
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  } finally {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) {}
  }
};

/**
 * @desc    Commit resolved CSV import rows to database (creates guest users and settlements if selected)
 * @route   POST /api/expenses/import/commit-clean
 * @access  Private
 */
export const commitCleanImport = async (req, res, next) => {
  const { groupId, rows } = req.body;

  if (!groupId || !rows || !Array.isArray(rows)) {
    return res.status(400).json({ success: false, error: 'Group ID and resolved rows are required.' });
  }

  try {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ success: false, error: 'Group not found.' });

    const operator = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { name: true }
    });

    let importedCount = 0;
    let skippedCount = 0;
    let refundsCount = 0;
    let duplicatesCount = 0;
    let settlementsCount = 0;
    let guestMembersCreated = [];
    let confirmedDuplicatesCount = 0;
    let possibleDuplicatesCount = 0;
    let unknownPayersCount = 0;
    let futureDatesCount = 0;
    let missingParticipantsCount = 0;
    let multiCurrencyRowsCount = 0;

    // Perform database writes in transaction
    await prisma.$transaction(async (tx) => {
      // Fetch active members list inside transaction
      let activeMembers = await tx.groupMember.findMany({
        where: { groupId, leftAt: null },
        include: { user: true }
      });

      const getOrCreateUser = async (name) => {
        let matched = activeMembers.find(m => m.user.name.toLowerCase() === name.toLowerCase() || m.user.email.toLowerCase() === name.toLowerCase());
        if (matched) return matched.user.id;

        // Check global user
        let user = await tx.user.findFirst({
          where: {
            OR: [
              { name: { equals: name, mode: 'insensitive' } },
              { email: { equals: name, mode: 'insensitive' } }
            ]
          }
        });

        if (!user) {
          // Create guest
          const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
          const uniqueEmail = `guest-${cleanName}-${Date.now()}-${Math.round(Math.random() * 1000)}@guest.sharebill.com`;
          user = await tx.user.create({
            data: {
              name,
              email: uniqueEmail,
              password: `guest_pwd_${Math.random()}`
            }
          });

          await tx.groupMember.create({
            data: {
              groupId,
              userId: user.id
            }
          });

          guestMembersCreated.push(name);

          // Log guest creation activity
          try {
            await logActivity({
              type: 'GUEST_CREATED',
              userId: req.user.id,
              userName: operator?.name,
              groupId,
              groupName: group.name,
              message: `Guest member "${name}" was created automatically during CSV import.`,
              details: { guestName: name, timestamp: new Date().toISOString() }
            });
          } catch (e) {}
        } else {
          // Add to group member
          const isMem = await tx.groupMember.findFirst({ where: { groupId, userId: user.id } });
          if (!isMem) {
            await tx.groupMember.create({ data: { groupId, userId: user.id } });
          }
        }

        // Refresh list
        activeMembers = await tx.groupMember.findMany({
          where: { groupId, leftAt: null },
          include: { user: true }
        });

        return user.id;
      };

      for (const row of rows) {
        if (row.rejected) {
          skippedCount++;
          continue;
        }

        const { date, description, paidBy, amount, currency, splitType, splitWith, splitDetails, convertToSettlement, duplicateStrategy } = row;

        if (duplicateStrategy === 'skip') {
          skippedCount++;
          continue;
        } else if (duplicateStrategy === 'import_new' || duplicateStrategy === 'keep_both') {
          duplicatesCount++;
        }

        const paidById = await getOrCreateUser(paidBy);

        // Track stats
        if (amount < 0 || row.isRefund || row.issues?.some(i => i.type === 'REFUND_DETECTED' || i.type === 'NEGATIVE_AMOUNT')) {
          refundsCount++;
        }

        if (row.issues && Array.isArray(row.issues)) {
          if (row.issues.some(i => i.type === 'DUPLICATE_CONFIRMED')) confirmedDuplicatesCount++;
          if (row.issues.some(i => i.type === 'POSSIBLE_DUPLICATE')) possibleDuplicatesCount++;
          if (row.issues.some(i => i.type === 'UNKNOWN_PAYER')) unknownPayersCount++;
          if (row.issues.some(i => i.type === 'FUTURE_DATE')) futureDatesCount++;
          if (row.issues.some(i => i.type === 'PARTICIPANTS_MISSING')) missingParticipantsCount++;
          if (row.issues.some(i => i.type === 'MULTI_CURRENCY_IMPORT')) multiCurrencyRowsCount++;
        }

        if (convertToSettlement) {
          settlementsCount++;
          const splitWithList = splitWith.split(/[;,]/).map(s => s.trim()).filter(s => s !== '');
          const toName = splitWithList[0] || 'Unknown';
          const toUserId = await getOrCreateUser(toName);

          await tx.settlement.create({
            data: {
              groupId,
              fromUserId: paidById,
              toUserId,
              amount,
              date: new Date(date)
            }
          });

          try {
            await logActivity({
              type: 'SETTLEMENT_DETECTED',
              userId: req.user.id,
              userName: operator?.name,
              groupId,
              groupName: group.name,
              message: `Reimbursement flow "${description}" auto-converted to settlement from "${paidBy}" to "${toName}"`,
              details: { from: paidBy, to: toName, amount, timestamp: new Date().toISOString() }
            });
          } catch (e) {}
        } else {
          // Normal expense
          const splitWithList = splitWith.split(/[;,]/).map(s => s.trim()).filter(s => s !== '');
          const splitWithIds = [];
          for (const name of splitWithList) {
            const id = await getOrCreateUser(name);
            splitWithIds.push(id);
          }

          const N = splitWithIds.length;
          let computedSplits = [];
          
          if (splitType === 'EQUAL') {
            const baseSplit = Math.floor((amount / N) * 100) / 100;
            let remaining = Math.round((amount - baseSplit * N) * 100) / 100;
            computedSplits = splitWithIds.map((userId, idx) => {
              let splitAmt = baseSplit;
              if (idx < Math.round(remaining * 100)) splitAmt += 0.01;
              return { userId, amount: splitAmt };
            });
          } else if (splitType === 'PERCENTAGE') {
            const details = parseSplitDetails(splitDetails, splitWithList);
            let sumSplitAmounts = 0;
            computedSplits = splitWithIds.map((userId, idx) => {
              const identifier = splitWithList[idx];
              const matchDet = details.find(d => d.identifier && d.identifier.toLowerCase() === identifier.toLowerCase());
              const pct = matchDet ? matchDet.value : (100 / N);
              const splitAmt = Math.round(((amount * pct) / 100) * 100) / 100;
              sumSplitAmounts += splitAmt;
              return { userId, amount: splitAmt, percentage: pct };
            });
            const diff = Math.round((amount - sumSplitAmounts) * 100) / 100;
            if (diff !== 0 && computedSplits.length > 0) {
              computedSplits[computedSplits.length - 1].amount = Math.round((computedSplits[computedSplits.length - 1].amount + diff) * 100) / 100;
            }
          } else if (splitType === 'EXACT') {
            const details = parseSplitDetails(splitDetails, splitWithList);
            computedSplits = splitWithIds.map((userId, idx) => {
              const identifier = splitWithList[idx];
              const matchDet = details.find(d => d.identifier && d.identifier.toLowerCase() === identifier.toLowerCase());
              const val = matchDet ? matchDet.value : (amount / N);
              return { userId, amount: Math.round(val * 100) / 100 };
            });
          } else if (splitType === 'SHARE') {
            const details = parseSplitDetails(splitDetails, splitWithList);
            let totalShares = 0;
            const sharesList = splitWithIds.map((userId, idx) => {
              const identifier = splitWithList[idx];
              const matchDet = details.find(d => d.identifier && d.identifier.toLowerCase() === identifier.toLowerCase());
              const sh = matchDet ? matchDet.value : 1;
              totalShares += sh;
              return { userId, shares: sh };
            });
            let sumSplitAmounts = 0;
            computedSplits = sharesList.map(s => {
              const splitAmt = Math.round(((amount * s.shares) / totalShares) * 100) / 100;
              sumSplitAmounts += splitAmt;
              return { userId, amount: splitAmt, shares: s.shares };
            });
            const diff = Math.round((amount - sumSplitAmounts) * 100) / 100;
            if (diff !== 0 && computedSplits.length > 0) {
              computedSplits[computedSplits.length - 1].amount = Math.round((computedSplits[computedSplits.length - 1].amount + diff) * 100) / 100;
            }
          }

          const createdExpense = await tx.expense.create({
            data: {
              description,
              amount,
              currency: currency || 'USD',
              date: new Date(date),
              groupId,
              paidById,
              splitType: splitType,
              isRefund: row.isRefund || false
            }
          });

          const splitData = computedSplits.map(s => ({
            expenseId: createdExpense.id,
            userId: s.userId,
            amount: s.amount,
            percentage: s.percentage !== undefined ? parseFloat(s.percentage) : null,
            shares: s.shares !== undefined ? parseFloat(s.shares) : null
          }));

          await tx.expenseSplit.createMany({
            data: splitData
          });
        }

        importedCount++;
      }
    });

    // Logging all actions to activity log
    try {
      await logActivity({
        type: 'IMPORT_COMPLETED',
        userId: req.user.id,
        userName: operator?.name,
        groupId,
        groupName: group.name,
        message: `${operator?.name || 'Someone'} completed import validation: ${importedCount} resolved rows added to group "${group.name}".`,
        details: {
          importedCount,
          skippedCount,
          refundsCount,
          duplicatesCount,
          settlementsCount,
          guestMembersCreatedCount: guestMembersCreated.length
        }
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      summary: {
        importedCount,
        skippedCount,
        refundsCount,
        duplicatesCount,
        settlementsCount,
        guestsCreated: guestMembersCreated,
        rejectedCount: skippedCount,
        reviewRequiredCount: rows.filter(r => r.status === 'REVIEW_REQUIRED' || (r.issues && r.issues.some(i => i.severity === 'REVIEW_REQUIRED'))).length,
        confirmedDuplicatesCount,
        possibleDuplicatesCount,
        unknownPayersCount,
        futureDatesCount,
        missingParticipantsCount,
        multiCurrencyRowsCount
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get AI resolution suggestions on parsed CSV rows
 * @route   POST /api/expenses/import/resolve-suggestions
 * @access  Private
 */
export const getImportSuggestions = async (req, res, next) => {
  const { groupId, validationReport } = req.body;
  if (!groupId || !validationReport) {
    return res.status(400).json({ success: false, error: 'Group ID and validation report are required.' });
  }

  try {
    const groupMembers = await prisma.groupMember.findMany({
      where: { groupId, leftAt: null },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    const existingExpenses = await prisma.expense.findMany({
      where: { groupId }
    });
    const defaultCurrency = existingExpenses[0]?.currency || 'USD';

    const aiSuggestions = await generateResolutionSuggestions(validationReport, groupMembers, defaultCurrency);

    res.status(200).json({
      success: true,
      suggestions: aiSuggestions.suggestions || [],
      engine: aiSuggestions.engine || 'Local Fallback'
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
