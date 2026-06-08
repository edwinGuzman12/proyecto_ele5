import axios from 'axios';

const API_URL = 'http://89.117.23.31:3511/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

export const login = async (username: string, password: string) => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

export const getProfile = async (token: string) => {
  const response = await api.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const marcarAsistencia = async (
  session_code: string,
  student_code: string,
  token: string
) => {
  const response = await api.post(
    '/attendance/mark',
    { session_code, student_code },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const getHistorialAsistencia = async (token: string) => {
  const response = await api.get('/attendance/electiva5', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export default api;