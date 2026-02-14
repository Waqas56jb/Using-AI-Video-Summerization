/**
 * Frontend API service - all backend communication.
 * Backend handles all API logic; this module only calls the backend.
 */
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '');

const HEALTH_PATH = API_BASE ? '/' : '/api';
export const api = {
  checkHealth() {
    return axios.get(API_BASE + HEALTH_PATH, { timeout: 8000 });
  },

  createUploadJob(formData) {
    return axios.post(API_BASE + '/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000
    });
  },

  getJobStatus(jobId) {
    return axios.get(API_BASE + '/api/status/' + jobId, { timeout: 10000 });
  }
};
