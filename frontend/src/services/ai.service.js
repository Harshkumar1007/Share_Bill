import api from './api';

export const aiService = {
  /**
   * Dispatch question query to the backend Financial Intelligence Agent.
   * @param {string} groupId 
   * @param {string} question 
   * @param {string} language 
   * @param {Array} history Chat history array: [{role: 'user'|'model', content: string}]
   * @returns {Promise<Object>}
   */
  queryAgent: async (groupId, question, language, history = []) => {
    const response = await api.post('/ai/query', { groupId, question, language, history });
    return response.data;
  }
};

export default aiService;
