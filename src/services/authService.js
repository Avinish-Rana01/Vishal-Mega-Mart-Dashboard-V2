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
