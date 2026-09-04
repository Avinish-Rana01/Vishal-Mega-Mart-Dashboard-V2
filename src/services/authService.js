import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const loginUser = async (userName, password, signal) => {
  const response = await axios.post(`${API_BASE}/api/Auth/login`, {
    userName,
    password
  }, {
    headers: {
      'Accept': '*/*',
      'Content-Type': 'application/json'
    },
    signal
  });
  return response.data;
};

export const requestPasswordReset = async (userName, signal) => {
  // Placeholder for real API reset endpoint
  // const response = await axios.post(`${API_BASE}/api/Auth/reset-password`, { userName }, { signal });
  // return response.data;
  return { success: true };
};

export const changePassword = async (userName, oldPassword, newPassword, signal) => {
  // Placeholder for real API change password endpoint
  // const response = await axios.post(`${API_BASE}/api/Auth/change-password`, { userName, oldPassword, newPassword }, { signal });
  // return response.data;
  return { success: true };
};
