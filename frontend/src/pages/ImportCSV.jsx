import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft, 
  Loader2, 
  FileText, 
  Copy, 
  Download, 
  Edit, 
  Trash2, 
  Check, 
  HelpCircle, 
  Info, 
  Settings, 
  ArrowRight,
  RefreshCw,
  TrendingUp,
  Award
} from 'lucide-react';
import { importService } from '../services/import.service';
import { groupService } from '../services/group.service';
import api from '../services/api';

export const ImportCSV = () => {
  // Upload States
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Group Metadata
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [defaultCurrency, setDefaultCurrency] = useState('USD');

  // CSV Validation Output
  const [validationReport, setValidationReport] = useState(null);
  const [resolvedRows, setResolvedRows] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [currentTab, setCurrentTab] = useState('WARNINGS');

  // Editing Row Modal State
  const [editingRow, setEditingRow] = useState(null);
  const [editForm, setEditForm] = useState({
    description: '',
    amount: '',
    date: '',
    paidBy: '',
    currency: '',
    splitType: 'EQUAL',
    splitWith: '',
    splitDetails: '',
    notes: ''
  });
  const [editError, setEditError] = useState('');

  // Post-Commit Output
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);

  // Fetch groups list on mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await groupService.getGroups();
        if (response.success) {
          setGroups(response.data || response.groups || []);
        }
      } catch (err) {
        console.error('Failed to load groups:', err);
      }
    };
    fetchGroups();
  }, []);

  // Fetch group members whenever selectedGroupId changes
  useEffect(() => {
    if (!selectedGroupId) {
      setGroupMembers([]);
      return;
    }
    const fetchGroupMembers = async () => {
      try {
        const res = await groupService.getGroupById(selectedGroupId);
        if (res.success && res.data) {
          const membersList = (res.data.members || []).map(m => m.user);
          setGroupMembers(membersList);
          
          // Determine default currency from existing expenses if any
          const exps = res.data.expenses || [];
          if (exps.length > 0 && exps[0].currency) {
            setDefaultCurrency(exps[0].currency);
          } else {
            setDefaultCurrency('USD');
          }
        }
      } catch (err) {
        console.error('Failed to load group members:', err);
      }
    };
    fetchGroupMembers();
  }, [selectedGroupId]);

  // Adjust active tab automatically when new validationReport is loaded
  useEffect(() => {
    if (validationReport) {
      // Find a tab that actually has content, or default to WARNINGS
      const counts = getTabCounts();
      if (counts.REVIEW_REQUIRED > 0) setCurrentTab('REVIEW_REQUIRED');
      else if (counts.WARNINGS > 0) setCurrentTab('WARNINGS');
      else if (counts.AI_SUGGESTIONS > 0) setCurrentTab('AI_SUGGESTIONS');
      else if (counts.AUTO_FIXED > 0) setCurrentTab('AUTO_FIXED');
      else if (counts.REJECTED > 0) setCurrentTab('REJECTED');
      else setCurrentTab('WARNINGS');
    }
  }, [validationReport]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setError('');
      } else {
        setError('Only CSV files are supported.');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Only CSV files are supported.');
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    if (!selectedGroupId) {
      setError('Please select a group first.');
      return;
    }

    setLoading(true);
    setError('');
    setImportResult(null);

    try {
      const response = await importService.validateCSV(file, selectedGroupId);
      if (response.success && response.report) {
        setValidationReport(response.report);
        setAiAnalysis(response.aiAnalysis);
        setAiSuggestions(response.aiSuggestions || []);
        
        // Initialize local copy of rows for dynamic inline resolutions
        const initializedRows = response.report.rows.map(row => ({
          ...row,
          // Set default resolution values if not set
          duplicateStrategy: row.issues?.some(i => i.type === 'DUPLICATE') ? 'keep_both' : 'keep_both',
          convertToSettlement: false,
          rejected: row.status === 'REJECTED',
          resolvedPayerName: null,
          resolvedDateVal: null
        }));
        setResolvedRows(initializedRows);
      } else {
        setError(response.error || 'Failed to analyze CSV file.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred during file validation.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setValidationReport(null);
    setResolvedRows([]);
    setAiAnalysis(null);
    setAiSuggestions([]);
    setImportResult(null);
    setError('');
  };

  // Helper: tab counts calculation
  const getTabCounts = () => {
    if (!resolvedRows) return { AUTO_FIXED: 0, WARNINGS: 0, REVIEW_REQUIRED: 0, REJECTED: 0, AI_SUGGESTIONS: 0 };
    
    return {
      AUTO_FIXED: resolvedRows.filter(r => r.autoFixes && r.autoFixes.length > 0 && !r.rejected).length,
      WARNINGS: resolvedRows.filter(r => r.issues?.some(i => i.severity === 'WARNING') && !r.rejected).length,
      REVIEW_REQUIRED: resolvedRows.filter(r => r.issues?.some(i => i.severity === 'REVIEW_REQUIRED') && !r.rejected).length,
      REJECTED: resolvedRows.filter(r => r.rejected).length,
      AI_SUGGESTIONS: aiSuggestions.filter(s => !s.applied && !s.rejected).length
    };
  };

  // AI Suggestion Application Core
  const applySuggestion = (sug) => {
    const action = sug.recommendedAction?.action;
    const params = sug.recommendedAction?.params || {};
    const rowNumber = params.rowNumber;
    if (!rowNumber) return;

    setResolvedRows(prev => prev.map(row => {
      if (row.rowNumber !== rowNumber) return row;

      let updatedRow = { ...row };
      let updatedRecord = row.record ? { ...row.record } : null;
      let remainingIssues = [...(row.issues || [])];

      if (action === 'skip') {
        updatedRow.duplicateStrategy = 'skip';
        updatedRow.rejected = true;
      } else if (action === 'keep_both') {
        updatedRow.duplicateStrategy = 'keep_both';
      } else if (action === 'use_dd_mm_yyyy' || action === 'use_mm_dd_yyyy') {
        const format = action === 'use_dd_mm_yyyy' ? 'DD-MM-YYYY' : 'MM-DD-YYYY';
        const rawDate = row.rawRow?.split(',')[0] || row.record?.date || '';
        const parts = rawDate.split(/[-/]/);
        if (parts.length === 3) {
          const val1 = parts[0].trim();
          const val2 = parts[1].trim();
          const year = parts[2].trim();
          let newDate = row.record?.date || '';
          if (format === 'MM-DD-YYYY') {
            newDate = `${year}-${val1.padStart(2, '0')}-${val2.padStart(2, '0')}`;
          } else if (format === 'DD-MM-YYYY') {
            newDate = `${year}-${val2.padStart(2, '0')}-${val1.padStart(2, '0')}`;
          }
          if (updatedRecord) updatedRecord.date = newDate;
          updatedRow.resolvedDateVal = format;
          remainingIssues = remainingIssues.filter(i => i.type !== 'AMBIGUOUS_DATE');
        }
      } else if (action === 'create_guest') {
        remainingIssues = remainingIssues.filter(i => i.type !== 'UNKNOWN_MEMBER' && i.type !== 'UNKNOWN_PARTICIPANT' && i.type !== 'UNKNOWN_MEMBER_PARTICIPANT');
      } else if (action === 'map_member') {
        const target = params.targetName || params.memberName;
        if (target) {
          if (updatedRecord) updatedRecord.paidBy = target;
          updatedRow.resolvedPayerName = target;
          remainingIssues = remainingIssues.filter(i => i.type !== 'UNKNOWN_MEMBER' && i.type !== 'MISSING_FIELDS' && i.type !== 'UNKNOWN_PARTICIPANT');
        }
      } else if (action === 'convert_to_settlement') {
        updatedRow.convertToSettlement = true;
        remainingIssues = remainingIssues.filter(i => i.type !== 'SETTLEMENT_DETECTED');
      } else if (action === 'keep_as_expense') {
        updatedRow.convertToSettlement = false;
        remainingIssues = remainingIssues.filter(i => i.type !== 'SETTLEMENT_DETECTED');
      } else if (action === 'preserve_currency') {
        remainingIssues = remainingIssues.filter(i => i.type !== 'MULTIPLE_CURRENCIES' && i.type !== 'MISSING_CURRENCY');
      } else if (action === 'convert_to_group_default') {
        if (updatedRecord) updatedRecord.currency = defaultCurrency;
        remainingIssues = remainingIssues.filter(i => i.type !== 'MULTIPLE_CURRENCIES' && i.type !== 'MISSING_CURRENCY');
      } else if (action === 'keep_equal') {
        if (updatedRecord) updatedRecord.splitType = 'EQUAL';
        remainingIssues = remainingIssues.filter(i => i.type !== 'EQUAL_SPLIT_CONFLICT');
      } else if (action === 'convert_to_share') {
        if (updatedRecord) updatedRecord.splitType = 'SHARE';
        remainingIssues = remainingIssues.filter(i => i.type !== 'EQUAL_SPLIT_CONFLICT');
      } else if (action === 'normalize_percentage') {
        if (updatedRecord && updatedRecord.splitDetails) {
          const parts = updatedRecord.splitDetails.split(/[规律;,]/).map(d => d.trim()).filter(d => d !== '');
          let sum = 0;
          const detailsList = parts.map(p => {
            const [name, val] = p.split(':');
            const value = parseFloat(val);
            if (!isNaN(value)) sum += value;
            return { name, value };
          });
          if (sum > 0) {
            const normalized = detailsList.map(d => `${d.name}:${((d.value / sum) * 100).toFixed(1)}`).join(';');
            updatedRecord.splitDetails = normalized;
          }
        }
        remainingIssues = remainingIssues.filter(i => i.type !== 'PERCENTAGE_SPLIT_CONFLICT' && i.type !== 'INVALID_PERCENTAGE_SPLIT');
      } else if (action === 'convert_to_absolute') {
        if (updatedRecord && row.record) updatedRecord.amount = Math.abs(row.record.amount);
        remainingIssues = remainingIssues.filter(i => i.type !== 'NEGATIVE_AMOUNT' && i.type !== 'REFUND_DETECTED');
      } else if (action === 'approve_lifecycle') {
        remainingIssues = remainingIssues.filter(i => i.type !== 'LIFECYCLE_VIOLATION');
      }

      let newStatus = 'VALID';
      if (remainingIssues.some(i => i.severity === 'CRITICAL')) {
        newStatus = 'REJECTED';
      } else if (remainingIssues.some(i => i.severity === 'REVIEW_REQUIRED')) {
        newStatus = 'REVIEW_REQUIRED';
      } else if (remainingIssues.some(i => i.severity === 'WARNING')) {
        newStatus = 'WARNING';
      }

      return {
        ...updatedRow,
        status: newStatus,
        rejected: newStatus === 'REJECTED' ? true : updatedRow.rejected,
        record: updatedRecord,
        issues: remainingIssues
      };
    }));

    setAiSuggestions(prev => prev.map(s => {
      if (s.issueId === sug.issueId) {
        return { ...s, applied: true };
      }
      return s;
    }));
  };

  const rejectSuggestion = (sug) => {
    setAiSuggestions(prev => prev.map(s => {
      if (s.issueId === sug.issueId) {
        return { ...s, rejected: true };
      }
      return s;
    }));
  };

  const handleApplyAllSafeSuggestions = () => {
    let appliedCount = 0;
    aiSuggestions.forEach(sug => {
      if (sug.safeToAutoApply && !sug.applied && !sug.rejected) {
        applySuggestion(sug);
        appliedCount++;
      }
    });
    if (appliedCount > 0) {
      alert(`Successfully applied ${appliedCount} safe AI suggestions automatically.`);
    } else {
      alert("No pending safe AI suggestions found.");
    }
  };

  // Row update helpers
  const updateRowField = (rowNumber, field, value) => {
    setResolvedRows(prev => prev.map(row => {
      if (row.rowNumber === rowNumber) {
        const updatedRecord = { ...row.record, [field]: value };
        return { ...row, record: updatedRecord };
      }
      return row;
    }));
  };

  const setDuplicateStrategy = (rowNumber, strategy) => {
    setResolvedRows(prev => prev.map(row => {
      if (row.rowNumber === rowNumber) {
        return { ...row, duplicateStrategy: strategy };
      }
      return row;
    }));
  };

  const toggleConvertSettlement = (rowNumber) => {
    setResolvedRows(prev => prev.map(row => {
      if (row.rowNumber === rowNumber) {
        return { ...row, convertToSettlement: !row.convertToSettlement };
      }
      return row;
    }));
  };

  const toggleRejectRow = (rowNumber) => {
    setResolvedRows(prev => prev.map(row => {
      if (row.rowNumber === rowNumber) {
        return { ...row, rejected: !row.rejected };
      }
      return row;
    }));
  };

  const resolveAmbiguousDate = (rowNumber, format) => {
    setResolvedRows(prev => prev.map(row => {
      if (row.rowNumber === rowNumber) {
        // Date parsing logic from DD-MM-YYYY or MM-DD-YYYY raw input
        const rawDate = row.rawRow?.split(',')[0] || row.record?.date || '';
        const parts = rawDate.split(/[-/]/);
        if (parts.length === 3) {
          const val1 = parts[0].trim();
          const val2 = parts[1].trim();
          const year = parts[2].trim();
          let newDate = row.record?.date || '';
          if (format === 'MM-DD-YYYY') {
            newDate = `${year}-${val1.padStart(2, '0')}-${val2.padStart(2, '0')}`;
          } else if (format === 'DD-MM-YYYY') {
            newDate = `${year}-${val2.padStart(2, '0')}-${val1.padStart(2, '0')}`;
          }
          return {
            ...row,
            record: row.record ? { ...row.record, date: newDate } : null,
            resolvedDateVal: format,
            // Clear ambiguous date warning locally
            issues: row.issues?.filter(i => i.type !== 'AMBIGUOUS_DATE') || []
          };
        }
      }
      return row;
    }));
  };

  const resolveUnknownPayer = (rowNumber, memberName) => {
    setResolvedRows(prev => prev.map(row => {
      if (row.rowNumber === rowNumber) {
        return {
          ...row,
          record: { ...row.record, paidBy: memberName },
          resolvedPayerName: memberName,
          // Clear unknown payer warning locally
          issues: row.issues.filter(i => i.type !== 'UNKNOWN_MEMBER' && i.type !== 'UNKNOWN_PAYER' && i.type !== 'MISSING_FIELDS')
        };
      }
      return row;
    }));
  };

  const resolveMissingParticipantsWithAll = (rowNumber) => {
    const memberNames = groupMembers.map(m => m.name).join(', ');
    setResolvedRows(prev => prev.map(row => {
      if (row.rowNumber === rowNumber) {
        const remainingIssues = (row.issues || []).filter(i => i.type !== 'PARTICIPANTS_MISSING' && i.type !== 'MISSING_PARTICIPANTS');
        let newStatus = 'VALID';
        if (remainingIssues.some(i => i.severity === 'CRITICAL')) {
          newStatus = 'REJECTED';
        } else if (remainingIssues.some(i => i.severity === 'REVIEW_REQUIRED')) {
          newStatus = 'REVIEW_REQUIRED';
        } else if (remainingIssues.some(i => i.severity === 'WARNING')) {
          newStatus = 'WARNING';
        }
        return {
          ...row,
          record: row.record ? { ...row.record, splitWith: memberNames } : null,
          status: newStatus,
          rejected: newStatus === 'REJECTED' ? true : row.rejected,
          issues: remainingIssues
        };
      }
      return row;
    }));
  };

  // Inline editing modal actions
  const openEditModal = (row) => {
    setEditingRow(row);
    setEditForm({
      description: row.record?.description || '',
      amount: row.record?.amount || '',
      date: row.record?.date || '',
      paidBy: row.record?.paidBy || '',
      currency: row.record?.currency || defaultCurrency,
      splitType: row.record?.splitType || 'EQUAL',
      splitWith: row.record?.splitWith || '',
      splitDetails: row.record?.splitDetails || '',
      notes: row.record?.notes || ''
    });
    setEditError('');
  };

  const closeEditModal = () => {
    setEditingRow(null);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editForm.description.trim()) {
      setEditError('Description is required.');
      return;
    }
    const parsedAmount = parseFloat(editForm.amount);
    if (isNaN(parsedAmount)) {
      setEditError('Amount must be a valid number.');
      return;
    }
    if (parsedAmount === 0) {
      setEditError('Amount cannot be zero.');
      return;
    }
    if (!editForm.date) {
      setEditError('Date is required.');
      return;
    }
    if (!editForm.paidBy.trim()) {
      setEditError('Paid By is required.');
      return;
    }

    // Split check if splitType is percentage
    if (editForm.splitType === 'PERCENTAGE' && editForm.splitDetails) {
      const parts = editForm.splitDetails.split(/[规律;,]/).map(d => d.trim()).filter(d => d !== '');
      let sum = 0;
      parts.forEach(p => {
        const val = p.includes(':') ? p.split(':')[1] : p;
        const num = parseFloat(val);
        if (!isNaN(num)) sum += num;
      });
      if (Math.abs(sum - 100) > 0.1 && parts.length > 0) {
        setEditError(`Split percentages must sum to 100% (currently ${sum}%).`);
        return;
      }
    }

    // Save edited values back to resolvedRows and clear related issues
    setResolvedRows(prev => prev.map(row => {
      if (row.rowNumber === editingRow.rowNumber) {
        let newStatus = 'VALID';
        let remainingIssues = (row.issues || []).filter(i => {
          // Clear fixed critical issues
          if (i.type === 'MISSING_FIELDS') return false;
          if (i.type === 'INVALID_AMOUNT') return false;
          if (i.type === 'ZERO_AMOUNT') return false;
          if (i.type === 'PERCENTAGE_SPLIT_CONFLICT' && editForm.splitType === 'PERCENTAGE') return false;
          return true;
        });

        if (remainingIssues.some(i => i.severity === 'CRITICAL')) {
          newStatus = 'REJECTED';
        } else if (remainingIssues.some(i => i.severity === 'REVIEW_REQUIRED')) {
          newStatus = 'REVIEW_REQUIRED';
        } else if (remainingIssues.some(i => i.severity === 'WARNING')) {
          newStatus = 'WARNING';
        }

        return {
          ...row,
          status: newStatus,
          rejected: newStatus === 'REJECTED' ? true : row.rejected,
          issues: remainingIssues,
          record: {
            ...(row.record || {}),
            description: editForm.description.trim(),
            amount: parsedAmount, // preserve negative amounts for refunds
            date: editForm.date,
            paidBy: editForm.paidBy.trim(),
            currency: editForm.currency,
            splitType: editForm.splitType,
            splitWith: editForm.splitWith,
            splitDetails: editForm.splitDetails,
            notes: editForm.notes.trim()
          }
        };
      }
      return row;
    }));

    setEditingRow(null);
  };

  // Bulk Actions
  const handleApproveAll = () => {
    // Keep both duplicates and skip no warnings
    setResolvedRows(prev => prev.map(row => {
      if (row.rejected) return row;
      const issues = row.issues || [];
      const updatedRow = { ...row };
      
      // Auto resolve ambiguous dates to DD-MM-YYYY if not selected
      if (issues.some(i => i.type === 'AMBIGUOUS_DATE')) {
        updatedRow.resolvedDateVal = 'DD-MM-YYYY';
      }
      
      // Auto keep duplicates
      if (issues.some(i => i.type === 'DUPLICATE')) {
        updatedRow.duplicateStrategy = 'keep_both';
      }

      return updatedRow;
    }));
  };

  // Error Report Compiler
  const handleDownloadErrorReport = () => {
    const errorRows = resolvedRows.filter(r => r.rejected || r.status === 'REJECTED');
    if (errorRows.length === 0) {
      alert("No rejected or skipped rows to download!");
      return;
    }

    let report = `SHAREBILL IMPORT ERROR REPORT\n`;
    report += `Generated: ${new Date().toLocaleString()}\n`;
    report += `Target Group: ${groups.find(g => g.id === selectedGroupId)?.name || 'Unknown'}\n`;
    report += `======================================================================\n\n`;

    errorRows.forEach(r => {
      report += `Row #${r.rowNumber}:\n`;
      report += `  Raw Data: ${r.rawRow || 'None'}\n`;
      report += `  Description: ${r.record?.description || 'N/A'}\n`;
      report += `  Amount: ${r.record?.amount || 0}\n`;
      report += `  Payer: ${r.record?.paidBy || 'N/A'}\n`;
      report += `  Rejection Reason:\n`;
      if (r.issues && r.issues.length > 0) {
        r.issues.forEach(i => {
          report += `    - [${i.severity}] ${i.type}: ${i.explanation} (${i.resolutionPolicy})\n`;
        });
      } else {
        report += `    - Manually rejected / skipped by user.\n`;
      }
      report += `----------------------------------------------------------------------\n\n`;
    });

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sharebill_import_error_report_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit Resolved Clean Import
  const handleCommitImport = async () => {
    const activeRows = resolvedRows.filter(r => !r.rejected && r.status !== 'REJECTED');
    if (activeRows.length === 0) {
      setError("No valid rows ready to be imported. All rows are rejected or skipped.");
      return;
    }

    const pendingReview = resolvedRows.filter(r => !r.rejected && r.status === 'REVIEW_REQUIRED');
    if (pendingReview.length > 0) {
      setError(`Please resolve or skip all ${pendingReview.length} rows requiring review (under the 'Review Required' tab) before importing.`);
      return;
    }

    setIsImporting(true);
    setError('');

    try {
      const rowsPayload = resolvedRows.map(row => ({
        date: row.record?.date || row.rawRow?.split(',')[0] || '',
        description: row.record?.description || 'Rejected Row',
        paidBy: row.record?.paidBy || '',
        amount: row.record?.amount || 0,
        currency: row.record?.currency || defaultCurrency,
        splitType: row.record?.splitType || 'EQUAL',
        splitWith: row.record?.splitWith || '',
        splitDetails: row.record?.splitDetails || '',
        convertToSettlement: row.convertToSettlement || false,
        duplicateStrategy: row.duplicateStrategy || 'keep_both',
        rejected: row.rejected || row.status === 'REJECTED',
        issues: row.issues,
        rowNumber: row.rowNumber
      }));

      const res = await importService.commitCleanImport(selectedGroupId, rowsPayload);
      if (res.success) {
        setImportResult(res.summary);
        
        // Fetch recent activity logs to show
        try {
          const acts = await api.get(`/activities?groupId=${selectedGroupId}`);
          setActivityLogs(acts.data || []);
        } catch (e) {
          // Simple fallback activity log display
          setActivityLogs([
            {
              type: 'IMPORT_COMPLETED',
              message: `Successfully imported ${res.summary.importedCount} rows to group.`,
              timestamp: new Date().toISOString()
            }
          ]);
        }
      } else {
        setError(res.error || 'Failed to finalize import.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred during final import.');
    } finally {
      setIsImporting(false);
    }
  };

  // Live calculation of preview stats
  const getPreviewSummary = () => {
    const activeRows = resolvedRows.filter(r => !r.rejected && r.record);
    
    // Guest creation estimation
    const uniqueGuests = new Set();
    activeRows.forEach(r => {
      // Check payer
      const payerName = r.record?.paidBy;
      if (payerName && typeof payerName === 'string') {
        const matchedPayer = groupMembers.find(m => m && m.name && m.name.toLowerCase() === payerName.toLowerCase());
        if (!matchedPayer) {
          uniqueGuests.add(payerName.trim());
        }
      }

      // Check splitWith members
      const splitWithList = r.record?.splitWith ? r.record.splitWith.split(/[规律;,]/).map(s => s.trim()).filter(s => s !== '') : [];
      splitWithList.forEach(name => {
        if (name && typeof name === 'string') {
          const matched = groupMembers.find(m => m && m.name && m.name.toLowerCase() === name.toLowerCase());
          if (!matched) {
            uniqueGuests.add(name);
          }
        }
      });
    });

    const refundsCount = activeRows.filter(r => r.record?.isRefund || r.issues?.some(i => i.type === 'REFUND_DETECTED' || i.type === 'NEGATIVE_AMOUNT')).length;
    const duplicatesCount = activeRows.filter(r => r.issues?.some(i => i.type === 'DUPLICATE' || i.type === 'DUPLICATE_CONFIRMED' || i.type === 'POSSIBLE_DUPLICATE') && r.duplicateStrategy !== 'skip').length;
    const settlementsCount = activeRows.filter(r => r.convertToSettlement).length;
    const warningsCount = activeRows.filter(r => r.issues?.some(i => i.severity === 'WARNING')).length;

    return {
      rowsToImport: activeRows.length,
      guestMembers: uniqueGuests.size,
      guestsList: Array.from(uniqueGuests),
      refunds: refundsCount,
      duplicates: duplicatesCount,
      settlements: settlementsCount,
      warnings: warningsCount
    };
  };

  const previewStats = getPreviewSummary();
  const tabCounts = getTabCounts();
  const secondaryMetrics = {
    refunds: resolvedRows.filter(r => r.record?.isRefund || r.issues?.some(i => i.type === 'REFUND_DETECTED' || i.type === 'NEGATIVE_AMOUNT')).length,
    confirmedDuplicates: resolvedRows.filter(r => r.issues?.some(i => i.type === 'DUPLICATE_CONFIRMED')).length,
    possibleDuplicates: resolvedRows.filter(r => r.issues?.some(i => i.type === 'POSSIBLE_DUPLICATE')).length,
    unknownPayers: resolvedRows.filter(r => r.issues?.some(i => i.type === 'UNKNOWN_PAYER')).length,
    futureDates: resolvedRows.filter(r => r.issues?.some(i => i.type === 'FUTURE_DATE')).length,
    missingParticipants: resolvedRows.filter(r => r.issues?.some(i => i.type === 'PARTICIPANTS_MISSING' || i.type === 'MISSING_PARTICIPANTS')).length,
    multiCurrencyRows: resolvedRows.filter(r => r.issues?.some(i => i.type === 'MULTI_CURRENCY_IMPORT' || i.type === 'MULTIPLE_CURRENCIES')).length,
  };

  const getCurrencyBreakdown = () => {
    const breakdown = {};
    resolvedRows.forEach(r => {
      if (!r.rejected && r.record) {
        const cur = r.record.currency || defaultCurrency;
        breakdown[cur] = (breakdown[cur] || 0) + r.record.amount;
      }
    });
    return breakdown;
  };
  const currencyBreakdown = getCurrencyBreakdown();

  // Filter rows matching tab
  const getTabRows = () => {
    switch (currentTab) {
      case 'AUTO_FIXED':
        return resolvedRows.filter(r => r.autoFixes && r.autoFixes.length > 0 && !r.rejected);
      case 'WARNINGS':
        return resolvedRows.filter(r => r.issues?.some(i => i.severity === 'WARNING') && !r.rejected);
      case 'REVIEW_REQUIRED':
        return resolvedRows.filter(r => r.issues?.some(i => i.severity === 'REVIEW_REQUIRED') && !r.rejected);
      case 'REJECTED':
        return resolvedRows.filter(r => r.rejected);
      default:
        return [];
    }
  };

  const activeTabRows = getTabRows();

  // Render helpers
  const getSeverityColor = (sev) => {
    if (sev === 'CRITICAL') return 'text-rose-650 bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400';
    if (sev === 'REVIEW_REQUIRED') return 'text-amber-700 bg-amber-50 border-amber-250 dark:bg-amber-950/20 dark:text-amber-400';
    return 'text-sky-700 bg-sky-50 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400';
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'VALID') return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400';
    if (status === 'WARNING') return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400';
    if (status === 'REVIEW_REQUIRED') return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400';
    return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400';
  };

  // SUCCESS SCREEN
  if (importResult) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16 font-sans">
        <div className="glass-card rounded-3xl p-8 border border-white/20 dark:border-dark-800 shadow-2xl bg-white/80 dark:bg-dark-900/70 text-center space-y-6">
          <div className="mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/30 p-4 w-20 h-20 flex items-center justify-center border-2 border-emerald-250">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-dark-50">Import Completed Successfully!</h1>
            <p className="text-slate-500 dark:text-dark-450 max-w-lg mx-auto">
              Your financial records have been parsed, validated, and resolved inside a secure database transaction.
            </p>
          </div>
                     {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto py-4">
            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-dark-950/40 border border-slate-100 dark:border-dark-800">
              <span className="block text-2xl font-bold text-slate-800 dark:text-dark-50">{importResult.importedCount}</span>
              <span className="text-xs text-slate-450 uppercase font-semibold">Imported</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-dark-950/40 border border-slate-100 dark:border-dark-800">
              <span className="block text-2xl font-bold text-orange-600 dark:text-orange-400">{importResult.refundsCount || 0}</span>
              <span className="text-xs text-slate-450 uppercase font-semibold">Refunds</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-dark-950/40 border border-slate-100 dark:border-dark-800">
              <span className="block text-2xl font-bold text-amber-600 dark:text-amber-400">{importResult.confirmedDuplicatesCount || 0}</span>
              <span className="text-xs text-slate-450 uppercase font-semibold">Confirmed Dups</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-dark-950/40 border border-slate-100 dark:border-dark-800">
              <span className="block text-2xl font-bold text-yellow-605 dark:text-yellow-400">{importResult.possibleDuplicatesCount || 0}</span>
              <span className="text-xs text-slate-450 uppercase font-semibold">Possible Dups</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-dark-950/40 border border-slate-100 dark:border-dark-800">
              <span className="block text-2xl font-bold text-rose-500 dark:text-rose-455">{importResult.rejectedCount || importResult.skippedCount}</span>
              <span className="text-xs text-slate-450 uppercase font-semibold">Skipped</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-dark-950/40 border border-slate-100 dark:border-dark-800">
              <span className="block text-2xl font-bold text-indigo-650 dark:text-indigo-400">{importResult.reviewRequiredCount || 0}</span>
              <span className="text-xs text-slate-450 uppercase font-semibold">Reviewed</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-dark-950/40 border border-slate-100 dark:border-dark-800">
              <span className="block text-2xl font-bold text-rose-600 dark:text-rose-400">{importResult.unknownPayersCount || 0}</span>
              <span className="text-xs text-slate-450 uppercase font-semibold">Unknown Payers</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-dark-950/40 border border-slate-100 dark:border-dark-800">
              <span className="block text-2xl font-bold text-blue-600 dark:text-blue-400">{importResult.futureDatesCount || 0}</span>
              <span className="text-xs text-slate-450 uppercase font-semibold">Future Dates</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-dark-950/40 border border-slate-100 dark:border-dark-800">
              <span className="block text-2xl font-bold text-indigo-605 dark:text-indigo-400">{importResult.settlementsCount}</span>
              <span className="text-xs text-slate-450 uppercase font-semibold">Settlements</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-dark-950/40 border border-slate-100 dark:border-dark-800">
              <span className="block text-2xl font-bold text-teal-650 dark:text-teal-400">{importResult.guestsCreated?.length || 0}</span>
              <span className="text-xs text-slate-450 uppercase font-semibold">Guests Created</span>
            </div>
          </div>

          {/* Guest profiles list if any */}
          {importResult.guestsCreated && importResult.guestsCreated.length > 0 && (
            <div className="bg-amber-50/40 border border-amber-200/40 rounded-2xl p-4 max-w-xl mx-auto text-left">
              <h3 className="text-sm font-bold text-amber-805 dark:text-amber-400 flex items-center gap-1.5 mb-2">
                <Award className="h-4 w-4" /> Guest Member Accounts Registered:
              </h3>
              <p className="text-xs text-slate-600 dark:text-dark-300">
                Created profiles with default logins for: <strong className="text-slate-800 dark:text-dark-100">{importResult.guestsCreated.join(', ')}</strong>
              </p>
            </div>
          )}

          {/* AI Analysis Final */}
          {aiAnalysis && (
            <div className="bg-gradient-to-tr from-brand-600/5 to-brand-500/5 border border-brand-500/10 rounded-2xl p-6 text-left max-w-2xl mx-auto space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-brand-500/10">
                <TrendingUp className="h-5 w-5 text-brand-500" />
                <h3 className="font-bold text-slate-800 dark:text-dark-100">AI Post-Import Analysis</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-bold text-xs text-slate-450 uppercase mb-1">Import Summary</h4>
                  <p className="text-slate-600 dark:text-dark-350 whitespace-pre-line">{aiAnalysis.importSummary}</p>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-450 uppercase mb-1">Expense Insights</h4>
                  <p className="text-slate-600 dark:text-dark-350 whitespace-pre-line">{aiAnalysis.expenseInsights}</p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-center gap-4">
            <button
              onClick={handleReset}
              className="px-6 py-3 font-semibold rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-dark-800 dark:hover:bg-dark-750 dark:text-dark-100 transition-colors"
            >
              Upload Another CSV
            </button>
            <a
              href={`/groups/${selectedGroupId}`}
              className="px-6 py-3 font-semibold rounded-2xl bg-brand-600 hover:bg-brand-500 text-white transition-colors shadow-lg shadow-brand-600/20"
            >
              View Group Ledger
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20 font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-dark-50">
            {validationReport ? 'Import Review Dashboard' : 'CSV Expense Import & Resolution Engine'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-dark-450 mt-1">
            Detect, resolve, and audit expense data problems before committing records.
          </p>
        </div>
        {validationReport && (
          <div className="flex gap-2">
            <button
              onClick={handleDownloadErrorReport}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-2xl border border-rose-200 text-rose-650 hover:bg-rose-50 dark:border-rose-900/30 dark:hover:bg-rose-950/20 transition-all"
            >
              <Download className="h-4 w-4" />
              Download Errors
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-105 dark:border-dark-750 dark:text-dark-200 dark:hover:bg-dark-800 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Upload New
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-650 flex items-center gap-2 dark:bg-rose-950/20 dark:text-rose-450 border border-rose-200/40">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* UPLOAD FORM VIEW */}
      {!validationReport && (
        <div className="max-w-2xl mx-auto glass-card rounded-3xl p-8 border border-white/20 dark:border-dark-800 shadow-xl bg-white/70 dark:bg-dark-900/60">
          <form onSubmit={handleUpload} className="space-y-6">
            
            {/* Group selector */}
            <div className="space-y-2">
              <label htmlFor="group-select" className="block text-sm font-semibold text-slate-755 dark:text-dark-200">
                Select Destination Group
              </label>
              <select
                id="group-select"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-805 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-dark-750 dark:bg-dark-900 dark:text-dark-100 transition-colors"
                required
              >
                <option value="">-- Choose a group to import into --</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            {/* Drag & Drop */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`relative rounded-2xl border-2 border-dashed p-12 text-center flex flex-col items-center justify-center transition-all duration-200 ${
                dragActive 
                  ? 'border-brand-500 bg-brand-50/30 dark:bg-brand-950/10' 
                  : file 
                    ? 'border-emerald-500/50 bg-emerald-50/5 dark:bg-emerald-950/5' 
                    : 'border-slate-300 hover:border-brand-400 dark:border-dark-750 dark:hover:border-brand-800'
              }`}
            >
              <input
                type="file"
                id="file-upload"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={loading}
              />
              
              {file ? (
                <FileSpreadsheet className="h-12 w-12 text-emerald-500 dark:text-emerald-400 mb-4 animate-bounce" />
              ) : (
                <Upload className="h-12 w-12 text-slate-400 dark:text-dark-450 mb-4" />
              )}

              {file ? (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-dark-100">{file.name}</p>
                  <p className="text-xs text-slate-450 dark:text-dark-450">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-700 dark:text-dark-200">
                    Drag and drop your expense CSV file here, or{' '}
                    <span className="text-brand-600 font-bold dark:text-brand-400">browse files</span>
                  </p>
                  <p className="text-xs text-slate-450 dark:text-dark-450">CSV headers required: date, description, paid_by, amount</p>
                </div>
              )}
            </div>

            {/* Selected File Badge */}
            {file && (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-dark-950/50 border border-slate-100 dark:border-dark-850">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-dark-200 truncate max-w-xs">{file.name}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  disabled={loading}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 dark:hover:bg-dark-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={!file || !selectedGroupId || loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-500 py-3.5 px-4 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 hover:from-brand-500 hover:to-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500 active:scale-[0.98] transition-all duration-200 disabled:opacity-45 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Validating CSV Rules & Checking Duplicates...
                </>
              ) : (
                'Upload & Run Validation'
              )}
            </button>
          </form>
        </div>
      )}

      {/* DASHBOARD VIEW */}
      {validationReport && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* LEFT: MAIN RESOLUTION INTERFACE */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Counts Summary grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="glass-card rounded-2xl p-4 border border-white/20 dark:border-dark-800 bg-white/70 dark:bg-dark-900/60 shadow-md">
                <span className="block text-2xl font-black text-slate-805 dark:text-dark-50">{validationReport.summary.totalRows}</span>
                <span className="text-xs font-semibold text-slate-400 dark:text-dark-450 uppercase">Total Rows</span>
              </div>
              <div className="glass-card rounded-2xl p-4 border border-white/20 dark:border-dark-800 bg-white/70 dark:bg-dark-900/60 shadow-md">
                <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400">{validationReport.summary.validCount}</span>
                <span className="text-xs font-semibold text-emerald-500 dark:text-emerald-450 uppercase">Valid Rows</span>
              </div>
              <div className="glass-card rounded-2xl p-4 border border-white/20 dark:border-dark-800 bg-white/70 dark:bg-dark-900/60 shadow-md">
                <span className="block text-2xl font-black text-amber-600 dark:text-amber-400">{tabCounts.WARNINGS}</span>
                <span className="text-xs font-semibold text-amber-505 dark:text-amber-405 uppercase">Warnings</span>
              </div>
              <div className="glass-card rounded-2xl p-4 border border-white/20 dark:border-dark-800 bg-white/70 dark:bg-dark-900/60 shadow-md">
                <span className="block text-2xl font-black text-indigo-600 dark:text-indigo-400">{tabCounts.REVIEW_REQUIRED}</span>
                <span className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase">Need Review</span>
              </div>
              <div className="glass-card rounded-2xl p-4 border border-white/20 dark:border-dark-800 bg-white/70 dark:bg-dark-900/60 shadow-md">
                <span className="block text-2xl font-black text-rose-650 dark:text-rose-450">{tabCounts.REJECTED}</span>
                <span className="text-xs font-semibold text-rose-500 dark:text-rose-400 uppercase">Rejected / Skipped</span>
              </div>
            </div>

            {/* Compliance Issues Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-4">
              <div className="rounded-2xl p-3 bg-orange-50/50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 border border-orange-200/40 text-center font-sans">
                <span className="block text-lg font-bold">{secondaryMetrics.refunds}</span>
                <span className="text-[9px] font-semibold uppercase tracking-wider block mt-0.5">Refunds</span>
              </div>
              <div className="rounded-2xl p-3 bg-amber-50/50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/40 text-center font-sans">
                <span className="block text-lg font-bold">{secondaryMetrics.confirmedDuplicates}</span>
                <span className="text-[9px] font-semibold uppercase tracking-wider block mt-0.5">Confirmed Dups</span>
              </div>
              <div className="rounded-2xl p-3 bg-yellow-50/55 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400 border border-yellow-200/40 text-center font-sans">
                <span className="block text-lg font-bold">{secondaryMetrics.possibleDuplicates}</span>
                <span className="text-[9px] font-semibold uppercase tracking-wider block mt-0.5">Possible Dups</span>
              </div>
              <div className="rounded-2xl p-3 bg-rose-50/50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/40 text-center font-sans">
                <span className="block text-lg font-bold">{secondaryMetrics.unknownPayers}</span>
                <span className="text-[9px] font-semibold uppercase tracking-wider block mt-0.5">Unknown Payers</span>
              </div>
              <div className="rounded-2xl p-3 bg-blue-50/50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200/40 text-center font-sans">
                <span className="block text-lg font-bold">{secondaryMetrics.futureDates}</span>
                <span className="text-[9px] font-semibold uppercase tracking-wider block mt-0.5">Future Dates</span>
              </div>
              <div className="rounded-2xl p-3 bg-indigo-50/50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-200/40 text-center font-sans">
                <span className="block text-lg font-bold">{secondaryMetrics.missingParticipants}</span>
                <span className="text-[9px] font-semibold uppercase tracking-wider block mt-0.5">Missing Splits</span>
              </div>
              <div className="rounded-2xl p-3 bg-teal-50/50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400 border border-teal-200/40 text-center font-sans">
                <span className="block text-lg font-bold">{secondaryMetrics.multiCurrencyRows}</span>
                <span className="text-[9px] font-semibold uppercase tracking-wider block mt-0.5">Multi-Currency</span>
              </div>
            </div>

            {/* RESOLUTION TABS */}
            <div className="glass-card rounded-3xl border border-white/20 dark:border-dark-800 bg-white/70 dark:bg-dark-900/60 shadow-xl overflow-hidden">
              
              {/* Tab headers */}
              <div className="border-b border-slate-100 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-950/20 px-6 py-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex space-x-1">
                  {[
                    { id: 'WARNINGS', label: 'Warnings', count: tabCounts.WARNINGS },
                    { id: 'REVIEW_REQUIRED', label: 'Review Required', count: tabCounts.REVIEW_REQUIRED },
                    { id: 'AUTO_FIXED', label: 'Auto-Fixed', count: tabCounts.AUTO_FIXED },
                    { id: 'REJECTED', label: 'Rejected / Skipped', count: tabCounts.REJECTED },
                    { id: 'AI_SUGGESTIONS', label: 'AI Suggestions', count: tabCounts.AI_SUGGESTIONS }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setCurrentTab(tab.id)}
                      className={`px-4 py-3 text-xs font-bold uppercase rounded-xl transition-all ${
                        currentTab === tab.id
                          ? 'bg-white text-brand-600 shadow-sm dark:bg-dark-805 dark:text-brand-400'
                          : 'text-slate-450 hover:text-slate-800 dark:hover:text-dark-100'
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>
                
                {/* Bulk tools */}
                <div className="flex gap-2">
                  {currentTab === 'AI_SUGGESTIONS' ? (
                    <button
                      onClick={handleApplyAllSafeSuggestions}
                      className="text-xs font-bold bg-emerald-50 border border-emerald-250 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-xl dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 transition-all flex items-center gap-1"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Apply All Safe AI Suggestions
                    </button>
                  ) : (
                    <button
                      onClick={handleApproveAll}
                      className="text-xs font-bold bg-brand-50 border border-brand-200 text-brand-700 hover:bg-brand-100 px-3 py-1.5 rounded-xl dark:bg-brand-950/20 dark:text-brand-400 dark:border-brand-900/30 transition-all"
                    >
                      Accept All Recommendations
                    </button>
                  )}
                </div>
              </div>

              {/* Rows List in Active Tab */}
              <div className="p-6 divide-y divide-slate-100 dark:divide-dark-800">
                {currentTab === 'AI_SUGGESTIONS' ? (
                  aiSuggestions.filter(s => !s.applied && !s.rejected).length > 0 ? (
                    aiSuggestions.filter(s => !s.applied && !s.rejected).map((sug) => {
                      const rowNum = sug.recommendedAction?.params?.rowNumber;
                      const relatedRow = resolvedRows.find(r => r.rowNumber === rowNum);
                      return (
                        <div key={sug.issueId} className="py-6 first:pt-0 last:pb-0 space-y-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-slate-400">Row #{rowNum || 'N/A'}</span>
                              <span className="text-xs px-2.5 py-0.5 rounded-full border font-bold bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-950/20 dark:text-brand-400">
                                {sug.type}
                              </span>
                              {sug.safeToAutoApply && (
                                <span className="text-xs px-2.5 py-0.5 rounded-full border font-bold bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400">
                                  SAFE SUGGESTION
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-455">
                                Confidence: <strong className="text-slate-805 dark:text-dark-50">{sug.confidence}%</strong>
                              </span>
                            </div>
                          </div>

                          <div className="bg-slate-50/50 dark:bg-dark-950/30 p-4 rounded-2xl border border-slate-100 dark:border-dark-800/80 space-y-2">
                            <div>
                              <span className="block text-2xs uppercase text-slate-400 font-bold">Problem Description</span>
                              <span className="text-sm font-semibold text-slate-850 dark:text-dark-50 block">
                                {relatedRow ? `"${relatedRow.record?.description}" paid by ${relatedRow.record?.paidBy} (${relatedRow.record?.amount})` : sug.explanation}
                              </span>
                            </div>
                            {relatedRow && (
                              <div>
                                <span className="block text-2xs uppercase text-slate-400 font-bold">AI Explanation</span>
                                <span className="text-xs text-slate-700 dark:text-dark-200 block mt-1">{sug.explanation}</span>
                              </div>
                            )}
                            <div className="pt-2 border-t border-slate-100 dark:border-dark-800/50">
                              <span className="block text-2xs uppercase text-slate-400 font-bold">Recommended Resolution</span>
                              <span className="text-xs font-bold text-brand-650 dark:text-brand-400 block mt-1">
                                {sug.recommendedAction?.description}
                              </span>
                            </div>
                            {sug.alternativeActions && sug.alternativeActions.length > 0 && (
                              <div className="pt-2">
                                <span className="block text-2xs uppercase text-slate-400 font-bold">Alternative Resolutions</span>
                                {sug.alternativeActions.map((alt, idx) => (
                                  <span key={idx} className="block text-3xs text-slate-500 dark:text-dark-450 mt-0.5">
                                    - {alt.description} (Confidence: {alt.confidence}%)
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => applySuggestion(sug)}
                              className="px-4 py-2 text-xs font-bold text-white bg-emerald-650 hover:bg-emerald-550 rounded-xl transition-all shadow-md shadow-emerald-600/10"
                            >
                              Accept Suggestion
                            </button>
                            <button
                              type="button"
                              onClick={() => rejectSuggestion(sug)}
                              className="px-4 py-2 text-xs font-bold text-slate-605 bg-slate-100 hover:bg-slate-205 rounded-xl dark:bg-dark-800 dark:text-dark-150 transition-all"
                            >
                              Reject
                            </button>
                            {relatedRow && (
                              <button
                                type="button"
                                onClick={() => openEditModal(relatedRow)}
                                className="px-4 py-2 text-xs font-bold text-brand-605 bg-brand-50 hover:bg-brand-100 rounded-xl dark:bg-brand-950/20 dark:text-brand-400 transition-all"
                              >
                                Edit Manually
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-slate-450">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm font-semibold">No pending AI suggestions available.</p>
                    </div>
                  )
                ) : activeTabRows.length > 0 ? (
                  activeTabRows.map((row) => (
                    <div key={row.rowNumber} className="py-6 first:pt-0 last:pb-0 space-y-4">
                      
                      {/* Row meta summary */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-slate-400">Row #{row.rowNumber}</span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${getStatusBadgeClass(row.status)}`}>
                            {row.status}
                          </span>
                          {row.rejected && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full border font-bold bg-rose-100 text-rose-800 border-rose-350">
                              SKIPPED
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEditModal(row)}
                            className="p-1.5 rounded-lg text-slate-455 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-dark-800 dark:hover:text-dark-100"
                            title="Edit row details"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleRejectRow(row.rowNumber)}
                            className={`p-1.5 rounded-lg border ${
                              row.rejected 
                                ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20' 
                                : 'text-slate-405 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-dark-800'
                            }`}
                            title={row.rejected ? "Keep Row in Import" : "Skip / Reject Row"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Financial info block */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-slate-50/50 dark:bg-dark-950/30 p-4 rounded-2xl border border-slate-100 dark:border-dark-800/80">
                        <div>
                          <span className="block text-2xs uppercase text-slate-400 font-bold">Description</span>
                          <span className="text-sm font-semibold text-slate-805 dark:text-dark-100 block truncate">{row.record?.description}</span>
                        </div>
                        <div>
                          <span className="block text-2xs uppercase text-slate-400 font-bold">Amount</span>
                          <span className="text-sm font-bold text-slate-850 dark:text-dark-50">{row.record?.currency || defaultCurrency} {row.record?.amount?.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="block text-2xs uppercase text-slate-400 font-bold">Payer (Paid By)</span>
                          <span className="text-sm font-semibold text-slate-805 dark:text-dark-100 block truncate">{row.record?.paidBy}</span>
                        </div>
                        <div>
                          <span className="block text-2xs uppercase text-slate-400 font-bold">Date</span>
                          <span className="text-sm font-semibold text-slate-805 dark:text-dark-100">{row.record?.date}</span>
                        </div>
                        <div>
                          <span className="block text-2xs uppercase text-slate-400 font-bold">Split Strategy</span>
                          <span className="text-sm font-semibold text-slate-805 dark:text-dark-100 block truncate">{row.record?.splitType} ({row.record?.splitWith ? row.record.splitWith.split(/[规律;,]/).length : 0} members)</span>
                        </div>
                      </div>

                      {/* Display Issues List & Actions */}
                      <div className="space-y-3">
                        {row.issues && row.issues.map((issue, idx) => (
                          <div key={idx} className={`border rounded-2xl p-4 text-xs space-y-3 ${getSeverityColor(issue.severity)}`}>
                            <div className="flex items-start gap-2">
                              {issue.severity === 'CRITICAL' ? (
                                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <span className="font-bold text-slate-800 dark:text-dark-50 mr-1.5">[{issue.type}]</span>
                                <span className="text-slate-700 dark:text-dark-200">{issue.explanation}</span>
                                <div className="text-2xs text-slate-400 mt-1 dark:text-dark-450">
                                  <strong>Resolution Policy:</strong> {issue.resolutionPolicy}
                                </div>
                              </div>
                            </div>

                            {/* Interactive Resolution Actions */}
                            {(issue.type === 'DUPLICATE' || issue.type === 'DUPLICATE_CONFIRMED' || issue.type === 'POSSIBLE_DUPLICATE') && (
                              <div className="pl-6 flex items-center gap-3">
                                <span className="font-semibold text-slate-705 dark:text-dark-250">Resolve duplicate:</span>
                                <div className="flex gap-2">
                                  {[
                                    { strategy: 'skip', label: 'Keep Existing (Skip)' },
                                    { strategy: 'import_new', label: 'Import New' },
                                    { strategy: 'keep_both', label: 'Keep Both' }
                                  ].map(opt => (
                                    <button
                                      key={opt.strategy}
                                      type="button"
                                      onClick={() => setDuplicateStrategy(row.rowNumber, opt.strategy)}
                                      className={`px-3 py-1 rounded-lg font-bold border transition-all ${
                                        row.duplicateStrategy === opt.strategy
                                          ? 'bg-slate-805 text-white dark:bg-dark-100 dark:text-dark-900 dark:border-dark-100'
                                          : 'bg-white hover:bg-slate-100 text-slate-655 border-slate-202 dark:bg-dark-900 dark:border-dark-750 dark:hover:bg-dark-800'
                                      }`}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {issue.type === 'SETTLEMENT_DETECTED' && (
                              <div className="pl-6 flex items-center gap-3">
                                <label className="flex items-center gap-2 font-semibold text-slate-705 dark:text-dark-250 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={row.convertToSettlement}
                                    onChange={() => toggleConvertSettlement(row.rowNumber)}
                                    className="rounded border-slate-300 text-brand-650 focus:ring-brand-500"
                                  />
                                  <span>Convert Expense to Settlement instead</span>
                                </label>
                              </div>
                            )}

                            {(issue.type === 'UNKNOWN_MEMBER' || issue.type === 'UNKNOWN_PAYER') && (
                              <div className="pl-6 flex flex-col gap-3">
                                <span className="font-semibold text-slate-750 dark:text-dark-250">Resolve Unknown Payer:</span>
                                <div className="flex flex-wrap items-center gap-3">
                                  <select
                                    value={row.resolvedPayerName || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val) resolveUnknownPayer(row.rowNumber, val);
                                    }}
                                    className="rounded-lg border-slate-350 text-xs bg-white py-1 px-2.5 text-slate-805 focus:outline-none dark:bg-dark-950 dark:border-dark-700 dark:text-dark-100"
                                  >
                                    <option value="">-- Map to Existing Member --</option>
                                    {groupMembers.filter(m => m && m.name).map(m => (
                                      <option key={m.id} value={m.name}>{m.name}</option>
                                    ))}
                                  </select>
                                  
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // Clear unknown payer warning locally
                                      setResolvedRows(prev => prev.map(r => {
                                        if (r.rowNumber === row.rowNumber) {
                                          return {
                                            ...r,
                                            issues: r.issues.filter(i => i.type !== 'UNKNOWN_PAYER' && i.type !== 'UNKNOWN_MEMBER')
                                          };
                                        }
                                        return r;
                                      }));
                                    }}
                                    className="px-3 py-1 rounded-lg font-bold border bg-brand-50 text-brand-700 hover:bg-brand-100 border-brand-200 dark:bg-brand-950/20 dark:text-brand-400 dark:border-brand-900/30 text-xs transition-all"
                                  >
                                    Create Guest Profile
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => toggleRejectRow(row.rowNumber)}
                                    className="px-3 py-1 rounded-lg font-bold border bg-rose-50 text-rose-705 hover:bg-rose-100 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30 text-xs transition-all"
                                  >
                                    Reject Row
                                  </button>
                                </div>
                              </div>
                            )}

                            {(issue.type === 'PARTICIPANTS_MISSING' || issue.type === 'MISSING_PARTICIPANTS') && (
                              <div className="pl-6 flex flex-col gap-2">
                                <span className="font-semibold text-slate-755 dark:text-dark-250">Resolve missing participants:</span>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => resolveMissingParticipantsWithAll(row.rowNumber)}
                                    className="px-3 py-1 rounded-lg font-bold border bg-brand-50 text-brand-700 hover:bg-brand-100 border-brand-200 dark:bg-brand-950/20 dark:text-brand-400 dark:border-brand-900/30 transition-all text-xs"
                                  >
                                    Split With All Group Members
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(row)}
                                    className="px-3 py-1 rounded-lg font-bold border bg-white hover:bg-slate-100 text-slate-655 border-slate-202 dark:bg-dark-900 dark:border-dark-750 dark:hover:bg-dark-800 transition-all text-xs"
                                  >
                                    Select Manually (Edit Details)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => toggleRejectRow(row.rowNumber)}
                                    className="px-3 py-1 rounded-lg font-bold border bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30 transition-all text-xs"
                                  >
                                    Reject/Skip Row
                                  </button>
                                </div>
                              </div>
                            )}

                            {issue.type === 'FUTURE_DATE' && (
                              <div className="pl-6 flex items-center gap-3">
                                <span className="font-semibold text-slate-705 dark:text-dark-250">Future Date Confirmation:</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setResolvedRows(prev => prev.map(r => {
                                      if (r.rowNumber === row.rowNumber) {
                                        return {
                                          ...r,
                                          issues: r.issues.filter(i => i.type !== 'FUTURE_DATE')
                                        };
                                      }
                                      return r;
                                    }));
                                  }}
                                  className="px-3 py-1 rounded-lg font-bold border bg-brand-50 text-brand-700 hover:bg-brand-100 border-brand-200 dark:bg-brand-950/20 dark:text-brand-400 dark:border-brand-900/30 text-xs transition-all"
                                >
                                  Confirm Future Date Import
                                </button>
                              </div>
                            )}

                            {issue.type === 'AMBIGUOUS_DATE' && (
                              <div className="pl-6 flex flex-col gap-2">
                                <span className="font-semibold text-slate-755 dark:text-dark-250">Resolve date format:</span>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => resolveAmbiguousDate(row.rowNumber, 'DD-MM-YYYY')}
                                    className={`px-3 py-1 rounded-lg border font-bold transition-all ${
                                      row.resolvedDateVal === 'DD-MM-YYYY'
                                        ? 'bg-slate-805 text-white'
                                        : 'bg-white text-slate-650'
                                    }`}
                                  >
                                    Interpret as DD-MM-YYYY
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => resolveAmbiguousDate(row.rowNumber, 'MM-DD-YYYY')}
                                    className={`px-3 py-1 rounded-lg border font-bold transition-all ${
                                      row.resolvedDateVal === 'MM-DD-YYYY'
                                        ? 'bg-slate-805 text-white'
                                        : 'bg-white text-slate-650'
                                    }`}
                                  >
                                    Interpret as MM-DD-YYYY
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Display Auto Fixes Log */}
                        {row.autoFixes && row.autoFixes.map((fix, idx) => (
                          <div key={idx} className="border border-emerald-200 bg-emerald-50/30 text-emerald-800 rounded-2xl p-4 text-xs dark:bg-emerald-950/10 dark:text-emerald-400 dark:border-emerald-900/30 flex items-start gap-2">
                            <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold mr-1.5">[AUTO FIXED]</span>
                              <span>
                                Changed field <strong className="text-slate-800 dark:text-dark-105">"{fix.field}"</strong> from <strong className="text-slate-800 dark:text-dark-105">"{String(fix.from)}"</strong> to <strong className="text-slate-800 dark:text-dark-105">"{String(fix.to)}"</strong>.
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-450">
                    <CheckCircle2 className="h-8 w-8 text-slate-305 mx-auto mb-2" />
                    <p className="text-sm font-semibold">No records in this tab category.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR: PREVIEW & AI METRICS */}
          <div className="space-y-6">
            
            {/* IMPORT PREVIEW STATS */}
            <div className="glass-card rounded-3xl border border-white/20 dark:border-dark-800 bg-white/70 dark:bg-dark-900/60 shadow-xl p-6 space-y-4">
              <h2 className="text-md font-bold text-slate-850 dark:text-dark-100 flex items-center gap-1.5 pb-3 border-b border-slate-100 dark:border-dark-800">
                <Settings className="h-4 w-4 text-brand-500" />
                Import Execution Preview
              </h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-450">Rows To Import</span>
                  <span className="font-bold text-slate-800 dark:text-dark-50">{previewStats.rowsToImport}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450">Guest Members To Create</span>
                  <span className="font-bold text-teal-650 dark:text-teal-400">{previewStats.guestMembers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450">Refunds (Negative Amounts)</span>
                  <span className="font-bold text-orange-650 dark:text-orange-400">{previewStats.refunds}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450">Duplicates Detected</span>
                  <span className="font-bold text-amber-605 dark:text-amber-400">{previewStats.duplicates}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450">Settlements Converted</span>
                  <span className="font-bold text-indigo-650 dark:text-indigo-400">{previewStats.settlements}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450">Warnings Remaining</span>
                  <span className="font-bold text-slate-700 dark:text-dark-250">{previewStats.warnings}</span>
                </div>
              </div>

              {/* Currency Breakdown list */}
              {Object.keys(currencyBreakdown).length > 1 && (
                <div className="bg-slate-50 dark:bg-dark-950/40 p-3 rounded-2xl border border-slate-100 dark:border-dark-850 space-y-1.5 text-xs">
                  <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Currency Breakdown</p>
                  {Object.entries(currencyBreakdown).map(([cur, amt]) => (
                    <div key={cur} className="flex justify-between font-semibold">
                      <span className="text-slate-500">{cur}</span>
                      <span className="text-slate-805 dark:text-dark-100">{amt.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Guests checklist review */}
              {previewStats.guestsList.length > 0 && (
                <div className="bg-teal-50/40 border border-teal-200/40 rounded-xl p-3 text-xs text-teal-850 dark:bg-teal-950/10 dark:text-teal-400 dark:border-teal-900/30">
                  <p className="font-bold mb-1">New guest members will be created for:</p>
                  <p className="font-medium">{previewStats.guestsList.join(', ')}</p>
                </div>
              )}

              <button
                onClick={handleCommitImport}
                disabled={previewStats.rowsToImport === 0 || isImporting}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-500 py-3 px-4 text-sm font-semibold text-white shadow-lg shadow-brand-600/20 hover:from-brand-500 hover:to-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Committing Ledger...
                  </>
                ) : (
                  <>
                    <span>Confirm & Import Clean Data</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            {/* AI ANALYSIS CARD */}
            {aiAnalysis && (
              <div className="glass-card rounded-3xl border border-brand-500/10 bg-brand-50/5 dark:bg-brand-950/5 shadow-xl p-6 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-brand-500/10">
                  <h2 className="text-md font-bold text-brand-700 dark:text-brand-400 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-brand-500" />
                    AI Validation Insights
                  </h2>
                  <span className="text-3xs bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Powered by AI
                  </span>
                </div>

                <div className="space-y-4 text-xs text-slate-700 dark:text-dark-200">
                  {aiAnalysis.importSummary && (
                    <div className="space-y-1">
                      <span className="block font-bold text-slate-450 uppercase text-3xs tracking-wider">Spend Summary</span>
                      <div className="p-3 bg-white dark:bg-dark-950 rounded-xl border border-slate-100 dark:border-dark-850 font-mono whitespace-pre-line text-slate-650 dark:text-dark-300">
                        {aiAnalysis.importSummary}
                      </div>
                    </div>
                  )}

                  {aiAnalysis.expenseInsights && (
                    <div className="space-y-1">
                      <span className="block font-bold text-slate-450 uppercase text-3xs tracking-wider">Expense Insights</span>
                      <div className="p-3 bg-white dark:bg-dark-950 rounded-xl border border-slate-100 dark:border-dark-850 whitespace-pre-line text-slate-600 dark:text-dark-300 font-medium">
                        {aiAnalysis.expenseInsights}
                      </div>
                    </div>
                  )}

                  {aiAnalysis.duplicateInsights && (
                    <div className="space-y-1">
                      <span className="block font-bold text-slate-450 uppercase text-3xs tracking-wider">Duplicate Analysis</span>
                      <p className="whitespace-pre-line bg-amber-50/20 border border-amber-250/20 p-3 rounded-xl text-amber-800 dark:text-amber-400 font-medium">
                        {aiAnalysis.duplicateInsights}
                      </p>
                    </div>
                  )}

                  {aiAnalysis.anomalyDetection && (
                    <div className="space-y-1">
                      <span className="block font-bold text-slate-450 uppercase text-3xs tracking-wider">Anomaly Warnings</span>
                      <p className="whitespace-pre-line bg-rose-50/20 border border-rose-250/20 p-3 rounded-xl text-rose-800 dark:text-rose-455 font-medium">
                        {aiAnalysis.anomalyDetection}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT MODAL OVERLAY */}
      {editingRow && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-dark-900 border border-slate-205 dark:border-dark-800 shadow-2xl rounded-3xl max-w-lg w-full overflow-hidden p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-800">
              <h3 className="text-md font-bold text-slate-805 dark:text-dark-100 flex items-center gap-2">
                <Edit className="h-5 w-5 text-brand-600" />
                Edit Row Details (Row #{editingRow.rowNumber})
              </h3>
              <button
                onClick={closeEditModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-dark-100 rounded-lg p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {editError && (
              <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/40">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-medium">
              
              {/* Description & Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-450 uppercase tracking-wider block font-bold text-3xs">Description</label>
                  <input
                    type="text"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-slate-800 bg-white dark:bg-dark-950 dark:border-dark-750 dark:text-dark-100"
                    placeholder="E.g., Dinner"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-450 uppercase tracking-wider block font-bold text-3xs">Amount</label>
                  <input
                    type="number"
                    step="any"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-slate-800 bg-white dark:bg-dark-950 dark:border-dark-750 dark:text-dark-100"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Date & Payer */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-450 uppercase tracking-wider block font-bold text-3xs">Date</label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-slate-800 bg-white dark:bg-dark-950 dark:border-dark-750 dark:text-dark-100"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-450 uppercase tracking-wider block font-bold text-3xs">Paid By</label>
                  <input
                    type="text"
                    value={editForm.paidBy}
                    onChange={(e) => setEditForm({ ...editForm, paidBy: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-slate-800 bg-white dark:bg-dark-950 dark:border-dark-750 dark:text-dark-100"
                    placeholder="Member name"
                    list="group-members-list"
                    required
                  />
                  <datalist id="group-members-list">
                    {groupMembers.filter(m => m && m.name).map(m => <option key={m.id} value={m.name} />)}
                  </datalist>
                </div>
              </div>

              {/* Split Strategy Options */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-450 uppercase tracking-wider block font-bold text-3xs">Split Type</label>
                  <select
                    value={editForm.splitType}
                    onChange={(e) => setEditForm({ ...editForm, splitType: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-slate-800 bg-white dark:bg-dark-950 dark:border-dark-750 dark:text-dark-100"
                  >
                    <option value="EQUAL">EQUAL</option>
                    <option value="PERCENTAGE">PERCENTAGE</option>
                    <option value="EXACT">EXACT</option>
                    <option value="SHARE">SHARE</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-450 uppercase tracking-wider block font-bold text-3xs">Split With</label>
                  <input
                    type="text"
                    value={editForm.splitWith}
                    onChange={(e) => setEditForm({ ...editForm, splitWith: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-slate-800 bg-white dark:bg-dark-950 dark:border-dark-750 dark:text-dark-100"
                    placeholder="E.g., Dev, Kabir, Sam"
                  />
                </div>
              </div>

              {/* Split details custom config */}
              <div className="space-y-1">
                <label className="text-slate-450 uppercase tracking-wider block font-bold text-3xs">Split Details</label>
                <input
                  type="text"
                  value={editForm.splitDetails}
                  onChange={(e) => setEditForm({ ...editForm, splitDetails: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-slate-800 bg-white dark:bg-dark-950 dark:border-dark-750 dark:text-dark-100"
                  placeholder="E.g., Dev:30, Kabir:70 or 30,70"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-450 uppercase tracking-wider block font-bold text-3xs">Notes (Optional)</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-slate-800 bg-white dark:bg-dark-950 dark:border-dark-750 dark:text-dark-100"
                  placeholder="Expense private notes..."
                />
              </div>

              {/* Footer buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-dark-800">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 font-semibold text-slate-605 bg-slate-100 hover:bg-slate-200 rounded-xl dark:bg-dark-800 dark:hover:bg-dark-750 dark:text-dark-150 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-brand-650 hover:bg-brand-550 rounded-xl transition-colors"
                >
                  Save Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportCSV;
