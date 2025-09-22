import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipeId: { type: String, required: true },
    rating: { type: Number, required: true },
}, { timestamps: true });

ratingSchema.index({ userId: 1, recipeId: 1 }, { unique: true });

const Rating = mongoose.model("Rating", ratingSchema);
export default Rating;
