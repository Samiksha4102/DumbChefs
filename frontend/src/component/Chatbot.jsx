// src/components/Chatbot.jsx
import React, { useEffect, useRef, useState } from "react";
import ChatbotIcon from "./ChatbotIcon";
import ChatMessage from "./ChatMessage";
import { support_info } from "../support_info";

const Chatbot = ({ onClose }) => {
    const [messages, setMessages] = useState([
    { role: "assistant", content: "How can I assist you today? " },
]);

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const chatBodyRef = useRef();

    // Scroll to bottom on new message
    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTo({
                top: chatBodyRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [messages]);

    // Send message and handle backend response
    const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
        // Prepend support_info as system prompt
        const response = await fetch("process.env.REACT_APP_BACKEND_URL/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                history: [
                    { role: "system", content: support_info },
                    ...newMessages,
                ],
            }),
        });

        const data = await response.json();
        

        setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.reply },
        ]);
    } catch (err) {
        setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "⚠️ Error connecting to server." },
        ]);
    } finally {
        setLoading(false);
    }
};



    return (
        <div className="fixed bottom-5 right-5 z-50 w-96 h-[500px] bg-yellow-100 rounded-2xl shadow-lg flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 p-3 border-b relative">
                <ChatbotIcon />
                <h2 className="font-semibold text-black">Chatbox</h2>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-3 w-9 h-9 rounded-lg bg-yellow-300 text-black flex items-center justify-center hover:bg-gray-300"
                >
                    ✖
                </button>
            </div>

            {/* Body */}
            <div ref={chatBodyRef} className="flex-1 overflow-y-auto p-3">
                {messages.map((chat, index) => (
                    <ChatMessage key={index} chat={chat} />
                ))}
                {loading && <p className="text-black">Thinking...</p>}
            </div>

            {/* Footer */}
            <div className="border-t p-2">
                <form onSubmit={handleFormSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 border rounded-lg px-3 py-2 text-black"
                        placeholder="Type your message..."
                    />
                    <button
                        type="submit"
                        className="bg-slate-600 text-white px-4 py-2 rounded-lg"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chatbot;
