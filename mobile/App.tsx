import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import LoginScreen from './screens/LoginScreen';
import AttendanceScreen from './screens/AttendanceScreen';
import FAB from './components/FAB';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [user, setUser] = useState<any>(null);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    setUser(null);
  };

  const esEstudiante = user?.role === 'estudiante';

  return (
    <>
      <StatusBar style="light" />
      {!user ? (
        <LoginScreen onLoginSuccess={setUser} />
      ) : !esEstudiante ? (
        <View style={styles.noAcceso}>
          <Text style={styles.noAccesoIcon}>🚫</Text>
          <Text style={styles.noAccesoTitle}>Acceso no permitido</Text>
          <Text style={styles.noAccesoText}>
            Esta app es solo para estudiantes.{'\n'}Usa la plataforma web para acceder como docente o admin.
          </Text>
          <FAB label="Cerrar sesión" onPress={handleLogout} />
        </View>
      ) : (
        <AttendanceScreen
          studentCode={user.student_code || user.username}
          userName={user.username}
          fullName={user.full_name || user.name}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  noAcceso: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  noAccesoIcon: { fontSize: 64, marginBottom: 16 },
  noAccesoTitle: { fontSize: 22, fontWeight: 'bold', color: '#C62828', marginBottom: 8 },
  noAccesoText: { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 22 },
});