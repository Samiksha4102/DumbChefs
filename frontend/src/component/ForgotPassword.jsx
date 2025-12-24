import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
    const [username, setUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleReset = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setMessage("❌ Passwords do not match.");
            return;
        }

        try {
            const res = await axios.post('process.env.REACT_APP_BACKEND_URL/api/v1/user/forgot-password', {
                username,
                newPassword,
                confirmPassword, // optional, if backend supports it
            });

            setMessage(res.data.message || '✅ Password reset successful.');
            setTimeout(() => navigate('/'), 2000);
        } catch (err) {
            console.error(err);
            setMessage(err.response?.data?.message || '❌ Something went wrong.');
        }
    };

    return (
        <div className="relative h-screen w-screen overflow-hidden">
            {/* 🔸 Background Video */}
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover z-0"
            >
                <source src="/LoginBg.mp4" type="video/mp4" />
            </video>

            {/* 🔸 Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-10" />

            {/* 🔸 Forgot Password Card */}
            <div className="relative z-20 flex items-center justify-center h-full">
                <div className="bg-white/20 backdrop-blur-md p-8 rounded-2xl shadow-lg w-96">
                    <h1 className="text-2xl text-center font-bold mb-6 text-yellow-500">
                        <a href="/">
                            <img src="/logo.png" alt="Logo" className="h-10 w-auto mx-auto mb-2" />
                        </a>
                        Reset Password
                    </h1>
                    <form onSubmit={handleReset} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-3 rounded-lg bg-white/80 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            required
                        />
                        <input
                            type="password"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full p-3 rounded-lg bg-white/80 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            required
                        />
                        <input
                            type="password"
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-3 rounded-lg bg-white/80 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            required
                        />
                        <button
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-yellow-600 text-white py-3 rounded-lg font-semibold transition"
                        >
                            Reset Password
                        </button>
                    </form>

                    <p className="mt-4 text-center text-white">
                        Remembered your password?{' '}
                        <Link
                            to="/Login"
                            className="underline hover:text-yellow-300 text-slate-300 font-semibold"
                        >
                            Back to Login
                        </Link>
                    </p>
                </div>
            </div>

            {/* 🔸 Message Display */}
            {message && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white text-slate-900 px-6 py-3 rounded-md shadow-md border border-gray-300">
                    {message}
                </div>
            )}
        </div>
    );
};

export default ForgotPassword;
