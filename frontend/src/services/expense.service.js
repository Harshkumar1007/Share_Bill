import api from './api';

export const expenseService = {
  getAllExpenses: async () => {
    const response = await api.get('/expenses');
    return response.data;
  },

  getExpenses: async (groupId) => {
    const response = await api.get(`/groups/${groupId}/expenses`);
    return response.data;
  },

  createExpense: async (groupId, expenseData) => {
    const response = await api.post(`/groups/${groupId}/expenses`, expenseData);
    return response.data;
  },

  deleteExpense: async (groupId, id) => {
    const response = await api.delete(`/groups/${groupId}/expenses/${id}`);
    return response.data;
  },

  settleUp: async (groupId, settleData) => {
    const response = await api.post(`/groups/${groupId}/expenses/settle`, settleData);
    return response.data;
  },

  deleteSettlement: async (groupId, id) => {
    const response = await api.delete(`/groups/${groupId}/expenses/settlements/${id}`);
    return response.data;
  },
};

export default expenseService;
