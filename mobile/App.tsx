import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './screens/LoginScreen';
import AttendanceScreen from './screens/AttendanceScreen';

export default function App() {
  const [user, setUser] = useState<any>(null);

  const handleLoginSuccess = (profile: any) => {
    setUser(profile);
  };

  return (
    <>
      <StatusBar style="auto" />
      {user ? (
        <AttendanceScreen studentCode={user.student_code || user.username} />
      ) : (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
}