import api from './api';

export const importService = {
  uploadCSV: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  commitImport: async (expenses) => {
    const response = await api.post('/import/commit', { expenses });
    return response.data;
  },

  getReportHistory: async () => {
    const response = await api.get('/import/reports');
    return response.data;
  },

  previewImport: async (file, groupId) => {
    const formData = new FormData();
    formData.append('file', file);
    if (groupId) {
      formData.append('groupId', groupId);
    }
    const response = await api.post('/expenses/import/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  validateCSV: async (file, groupId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('groupId', groupId);
    const response = await api.post('/expenses/import/validate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  commitCleanImport: async (groupId, rows) => {
    const response = await api.post('/expenses/import/commit-clean', { groupId, rows });
    return response.data;
  },
};

export default importService;
