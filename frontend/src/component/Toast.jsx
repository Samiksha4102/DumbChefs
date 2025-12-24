import React, { useEffect } from "react";
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from "react-icons/fa";

const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    // Styles for the glassmorphism and glow
    const baseStyle = "fixed top-10 left-1/2 z-[100] flex items-center gap-4 px-6 py-4 rounded-2xl border text-white backdrop-blur-md shadow-2xl transition-all duration-300";

    // Theme colors matching DumbChefs (Dark + Orange/Green)
    const typeStyles = {
        success: {
            container: "bg-black/80 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]",
            icon: "text-green-400",
            iconComp: <FaCheckCircle className="text-2xl" />
        },
        warning: {
            container: "bg-black/80 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)]",
            icon: "text-orange-400",
            iconComp: <FaExclamationTriangle className="text-2xl" />
        },
        error: {
            container: "bg-black/80 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]",
            icon: "text-red-400",
            iconComp: <FaInfoCircle className="text-2xl" />
        },
        info: {
            container: "bg-black/80 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)]",
            icon: "text-blue-400",
            iconComp: <FaInfoCircle className="text-2xl" />
        }
    };

    const currentStyle = typeStyles[type] || typeStyles.info;

    return (
        <>
            <style>
                {`
                @keyframes popIn {
                    0% { transform: translate(-50%, -20px) scale(0.8); opacity: 0; }
                    50% { transform: translate(-50%, 5px) scale(1.05); opacity: 1; }
                    100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
                }
                .animate-pop {
                    animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                `}
            </style>
            <div className={`${baseStyle} ${currentStyle.container} animate-pop`}>
                <div className={`${currentStyle.icon}`}>
                    {currentStyle.iconComp}
                </div>
                <div className="flex-1 font-bold text-lg tracking-wide">
                    {message}
                </div>
                <button
                    onClick={onClose}
                    className="ml-2 p-1 rounded-full hover:bg-white/20 transition opacity-70 hover:opacity-100"
                >
                    <FaTimes />
                </button>
            </div>
        </>
    );
};

export default Toast;
