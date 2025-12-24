import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const signUp = async (req, res) => {
    try {
        const { fullName, username, password, confirmPassword, email } = req.body;
        if (!fullName || !username || !password || !confirmPassword || !email) {
            return res.status(400).json({ message: "All the fields are required." });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match." });
        }
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: "Username already exists, try another one." });
        }
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(400).json({ message: "Email already exists, try another one." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            fullName,
            username,
            password: hashedPassword,
            email,
        });
        return res.status(201).json({ message: "User registered successfully." });
    } catch (error) {
        console.error("Error in registerUser:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required." });
        }
        const user = await User.findOne({ username }); //finds user
        if (!user) {
            return res.status(404).json({ message: "Incorrect username or password." });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password." });
        };
        const tokenDAta = {
            userId: user._id
        }
        const token = await jwt.sign(tokenDAta, process.env.JWT_SECRET_KEY, { expiresIn: "30d" });

        const isProduction = process.env.NODE_ENV === "production" || process.env.FRONTEND_URL;

        return res.status(200).cookie("token", token, {
            maxAge: 30 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: isProduction ? 'none' : 'strict',
            secure: isProduction ? true : false
        }).json({
            message: "User logged in successfully.",
            success: true,
            user: {
                _id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Error in loginUser:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const logout = (req, res) => {
    try {
        const isProduction = process.env.NODE_ENV === "production" || process.env.FRONTEND_URL;
        return res.status(200).cookie("token", "", {
            maxAge: 0,
            httpOnly: true,
            sameSite: isProduction ? 'none' : 'strict',
            secure: isProduction ? true : false
        }).json({ message: "User logged out successfully." });

    } catch (error) {
        console.error("Error in logoutUser:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const forgotPassword = async (req, res) => {
    const { username, newPassword } = req.body;

    if (!username || !newPassword) {
        return res.status(400).json({ message: "Username and new password are required." });
    }

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Hash the new password before saving
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        await user.save();

        res.status(200).json({ message: "Password has been updated successfully." });
    } catch (err) {
        console.error("Error resetting password:", err);
        res.status(500).json({ message: "Server error while resetting password." });
    }
}



export const updateProfile = async (req, res) => {
    try {
        // Assuming your auth middleware sets req.userId or similar
        const userId = req.id;  // Make sure your auth middleware attaches userId here
        const { username, email, currentPassword, newPassword } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found." });

        // If user wants to change password, validate current password first
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: "Current password is required to change password." });
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: "Current password is incorrect." });
            }

            // Hash and update new password
            user.password = await bcrypt.hash(newPassword, 10);
        }

        // Update username/email if provided
        if (username) user.username = username;
        if (email) user.email = email;

        await user.save();

        // Return updated user info (excluding password)
        const { password, ...userData } = user.toObject();

        res.status(200).json({ message: "Profile updated successfully.", user: userData });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
