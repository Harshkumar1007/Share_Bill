import api from './api';

export const groupService = {
  getGroups: async () => {
    const response = await api.get('/groups');
    return response.data;
  },

  getGroupById: async (id) => {
    const response = await api.get(`/groups/${id}`);
    return response.data;
  },

  createGroup: async (groupData) => {
    const response = await api.post('/groups', groupData);
    return response.data;
  },

  addMember: async (groupId, email) => {
    const response = await api.post(`/groups/${groupId}/members`, { email });
    return response.data;
  },

  removeMember: async (groupId, userId) => {
    const response = await api.delete(`/groups/${groupId}/members/${userId}`);
    return response.data;
  },

  getGroupBalances: async (groupId) => {
    const response = await api.get(`/groups/${groupId}/balances`);
    return response.data;
  },

  updateGroup: async (id, groupData) => {
    const response = await api.put(`/groups/${id}`, groupData);
    return response.data;
  },

  deleteGroup: async (id) => {
    const response = await api.delete(`/groups/${id}`);
    return response.data;
  },
};

export default groupService;
