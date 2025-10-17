import Login from '@/components/organs/auth/Login';
import Signup from '@/components/organs/auth/Signup';
import { Routes, Route, Navigate } from 'react-router-dom';

export default function Auth() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}