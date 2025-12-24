import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const SignUp = () => {
    const [user, setUser] = useState({
        fullName: "",
        username: "",
        password: "",
        confirmPassword: "",
        email: "",
    });

    const [errors, setErrors] = useState({});
    const [successMsg, setSuccessMsg] = useState("");
    const navigate = useNavigate();

    const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{1,8}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameRegex = /^[A-Za-z]+(?:\s[A-Za-z]+){0,2}$/;

    const validateForm = () => {
        let newErrors = {};

        if (!nameRegex.test(user.fullName)) {
            newErrors.fullName =
                "Full name must contain only letters and max 3 words";
        }

        if (!emailRegex.test(user.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        if (!passwordRegex.test(user.password)) {
            newErrors.password =
                "Password must be max 8 characters and include uppercase, lowercase, number, and special symbol";
        }

        if (user.password !== user.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const onSubmitHandler = async (e) => {
        e.preventDefault();

        if (!validateForm()) return; // Stop if validation fails

        try {
            const res = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/v1/user/signUp`,
                user,
                {
                    headers: { "Content-Type": "application/json" },
                    withCredentials: true,
                }
            );

            if (res.status === 201) {
                setSuccessMsg("✅ SignUp successful!");
                setTimeout(() => navigate("/homePage"), 2000);
            }
        } catch (error) {
            console.error("Error during sign up:", error);
        }

        setUser({
            fullName: "",
            username: "",
            password: "",
            confirmPassword: "",
            email: "",
        });
    };

    return (
        <>
            <div
                className="h-screen w-screen bg-cover bg-center flex items-center justify-center"
            >
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover z-0"
                >
                    <source src="/LoginBg.mp4" type="video/mp4" />
                </video>
                <div className="bg-white/20 backdrop-blur-md p-8 rounded-2xl shadow-lg w-96">
                    <h1 className="text-2xl text-center font-bold mb-6 text-yellow-500">
                        Made for you!
                    </h1>
                    <h2 className="text-2xl text-center mb-6 text-slate-900 font-italic">
                        "Discover recipes with whatever you have"
                    </h2>
                    <form onSubmit={onSubmitHandler} className="space-y-4">
                        <div>
                            <input
                                value={user.fullName}
                                onChange={(e) => setUser({ ...user, fullName: e.target.value })}
                                type="text"
                                placeholder="Full Name"
                                className="w-full p-3 rounded-lg bg-white/80 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                required
                            />
                            {errors.fullName && (
                                <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                            )}
                        </div>
                        <div>
                            <input
                                value={user.username}
                                onChange={(e) => setUser({ ...user, username: e.target.value })}
                                type="text"
                                placeholder="Username"
                                className="w-full p-3 rounded-lg bg-white/80 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                required
                            />
                        </div>
                        <div>
                            <input
                                value={user.email}
                                onChange={(e) => setUser({ ...user, email: e.target.value })}
                                type="text"
                                placeholder="Email"
                                className="w-full p-3 rounded-lg bg-white/80 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                required
                            />
                            {errors.email && (
                                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                            )}
                        </div>
                        <div>
                            <input
                                value={user.password}
                                onChange={(e) => setUser({ ...user, password: e.target.value })}
                                type="password"
                                placeholder="Password"
                                className="w-full p-3 rounded-lg bg-white/80 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                required
                            />
                            {errors.password && (
                                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                            )}
                        </div>
                        <div>
                            <input
                                value={user.confirmPassword}
                                onChange={(e) =>
                                    setUser({ ...user, confirmPassword: e.target.value })
                                }
                                type="password"
                                placeholder="Confirm Password"
                                className="w-full p-3 rounded-lg bg-white/80 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                required
                            />
                            {errors.confirmPassword && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.confirmPassword}
                                </p>
                            )}
                        </div>

                        <p className="mt-4 text-center text-white">
                            Already have an account?{" "}
                            <Link to="/Login" className="underline hover:text-yellow-300  text-slate-400 font-semibold">
                                Login
                            </Link>
                        </p>

                        <button
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-yellow-600 text-white py-3 rounded-lg font-semibold transition"
                        >
                            Sign Up
                        </button>
                    </form>
                </div>
            </div>
            {successMsg && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-100 text-green-800 px-6 py-3 rounded-md shadow-md border border-green-300">
                    {successMsg}
                </div>
            )}
        </>
    );
};

export default SignUp;
