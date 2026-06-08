import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './screens/LoginScreen';
import AttendanceScreen from './screens/AttendanceScreen';

export default function App() {
  const [user, setUser] = useState<any>(null);

  return (
    <>
      <StatusBar style="light" />
      {user ? (
        <AttendanceScreen
          studentCode={user.student_code || user.username}
          userName={user.username}
          fullName={user.full_name || user.name || user.nombre}
        />
      ) : (
        <LoginScreen onLoginSuccess={setUser} />
      )}
    </>
  );
}