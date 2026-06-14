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
};

export default importService;
