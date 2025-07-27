import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const [username, setUsername] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    if (!token) {
      router.push('/');
      return;
    }
    setUsername(storedUsername || 'User');
  }, [router]);

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      {/* Home Button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={handleGoHome}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
        >
          Home
        </button>
      </div>
      <h1 className="text-3xl font-bold mb-6">Hi! {username}</h1>
      <button
        onClick={() => {
          localStorage.clear();
          router.push('/');
        }}
        className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
      >
        Logout
      </button>
    </div>
  );
} 