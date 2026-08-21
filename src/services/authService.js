import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Set this to true to deploy the frontend as a demo without a real backend API
const USE_MOCK_LOGIN = true; 

export const loginUser = async (userName, password, signal) => {
  if (USE_MOCK_LOGIN) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate successful backend response for the demo
    return { 
      userName: userName || 'DemoUser', 
      role: 'Admin', 
      token: 'demo_mock_token_12345' 
    };
  }

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
