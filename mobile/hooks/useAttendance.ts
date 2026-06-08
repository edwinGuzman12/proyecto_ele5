import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { marcarAsistencia, getHistorialAsistencia } from '../service/api';

export interface AsistenciaItem {
  session_id: number;
  date: string;
  status: string;
  is_open: boolean;
}

export interface HistorialData {
  asistencias: AsistenciaItem[];
  total_clases: number;
  total_asistidas: number;
  total_ausentes: number;
  porcentaje: number;
}

export const useAttendance = () => {
  const [loading, setLoading] = useState(false);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [historial, setHistorial] = useState<HistorialData | null>(null);

  const registrarAsistencia = async (session_code: string, student_code: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = (await AsyncStorage.getItem('access_token')) || '';
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const realStudentCode = user?.student_code || student_code;
      const response = await marcarAsistencia(session_code, realStudentCode, token);
      setSuccess(response.message || '¡Asistencia registrada exitosamente!');
      await cargarHistorial();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al registrar asistencia');
    } finally {
      setLoading(false);
    }
  };

  const cargarHistorial = useCallback(async () => {
    setLoadingHistorial(true);
    try {
      const token = (await AsyncStorage.getItem('access_token')) || '';
      const data = await getHistorialAsistencia(token);
      setHistorial({
        asistencias: data.sessions || [],
        total_clases: data.summary?.total ?? 0,
        total_asistidas: data.summary?.presente ?? 0,
        total_ausentes: data.summary?.ausente ?? 0,
        porcentaje: data.summary?.percentage ?? 0,
      });
    } catch (e: any) {
      console.error('Error:', e.response?.data || e.message);
    } finally {
      setLoadingHistorial(false);
    }
  }, []);

  return { registrarAsistencia, cargarHistorial, loading, loadingHistorial, error, success, historial };
};