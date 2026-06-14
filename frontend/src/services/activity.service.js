import api from './api';

export const activityService = {
  getActivities: async () => {
    const response = await api.get('/activities');
    return response.data;
  }
};

export default activityService;
