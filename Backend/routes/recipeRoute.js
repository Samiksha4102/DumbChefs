import express from "express";
import { User } from "../models/userModel.js";
import isAuthenticated from "../middleware/isAuthenticated.js";
import Rating from "../models/ratingModel.js";
import Recipe from "../models/recipeModel.js";
import axios from "axios";
const router = express.Router();

// Save a recipe for a logged-in user
router.post("/save", isAuthenticated, async (req, res) => {
    try {
        const { recipeId, name, image, content, ingredientsList, videoLink, orderLink, cuisine, mealType, diet, cookingTime, complexity } = req.body;
        const userId = req.id;

        if (!recipeId || !name || !image) {
            return res.status(400).json({ message: "RecipeId, name, and image are required." });
        }

        let recipe = await Recipe.findOne({ recipeId });
        if (!recipe) {
            recipe = new Recipe({
                recipeId,
                name,
                image,
                content,
                ingredientsList,
                videoLink,
                orderLink,
                cuisine,
                mealType,
                diet,
                cookingTime,
                complexity,
            });
            await recipe.save();
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found." });

        const alreadySaved = user.savedRecipes.some(r => r.recipeId === recipeId);
        if (alreadySaved) {
            return res.status(400).json({ message: "Recipe already saved." });
        }

        // Save recipe reference in user's savedRecipes
        user.savedRecipes.push({
            recipeId,
            name,
            image,
            content,
            ingredientsList,
            videoLink,
            orderLink,
            cuisine,
            mealType,
            diet,
            cookingTime,
            complexity,
            nutrition: req.body.nutrition || {}, // Make sure this is being sent
        });

        await user.save();


        res.status(200).json({
            message: "Recipe saved successfully.",
            savedRecipes: user.savedRecipes,
        });
    } catch (error) {
        console.error("Error saving recipe:", error);
        res.status(500).json({ message: "Server error while saving recipe." });
    }
});


// Unsave a recipe for a logged-in user
router.post("/unsave", isAuthenticated, async (req, res) => {
    const { recipeId } = req.body;
    const userId = req.id; // req.id is set by isAuthenticated middleware

    if (!recipeId) {
        return res.status(400).json({ message: "Recipe ID is required." });
    }

    try {
        await User.findByIdAndUpdate(userId, {
            $pull: { savedRecipes: { recipeId: recipeId } }
        });

        return res.status(200).json({ message: "Recipe unsaved successfully." });
    } catch (error) {
        console.error("Unsave recipe error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});



// Get all saved recipes for logged-in user
router.get("/saved", isAuthenticated, async (req, res) => {
    try {
        const userId = req.id;
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: "User not found." });

        res.status(200).json({ savedRecipes: user.savedRecipes });
    } catch (error) {
        console.error("Error fetching saved recipes:", error);
        res.status(500).json({ message: "Server error while fetching recipes." });
    }
});

// Share a saved recipe by recipeId
router.get("/share/:recipeId", async (req, res) => {
    try {
        const { recipeId } = req.params;

        // 1. Try finding in Recipe collection (Global Cache)
        let recipe = await Recipe.findOne({ recipeId });

        // 2. If found, return it
        if (recipe) {
            return res.status(200).json({ recipe });
        }

        // 3. Fallback: Fetch from Spoonacular
        if (!process.env.SPOONACULAR_API_KEY) {
            return res.status(404).json({ message: "Recipe not found in DB and API key missing." });
        }

        const response = await axios.get(
            `https://api.spoonacular.com/recipes/${recipeId}/information`,
            { params: { apiKey: process.env.SPOONACULAR_API_KEY } }
        );

        if (response.data) {
            const data = response.data;
            // Map Spoonacular data to our schema
            const newRecipe = new Recipe({
                recipeId: data.id.toString(),
                name: data.title,
                image: data.image,
                content: data.instructions || data.summary || "No instructions available.",
                ingredientsList: data.extendedIngredients ? data.extendedIngredients.map(i => i.original) : [],
                videoLink: "",
                orderLink: "",
                cuisine: data.cuisines?.join(", ") || "",
                mealType: data.dishTypes?.join(", ") || "",
                diet: data.diets?.join(", ") || "",
                cookingTime: data.readyInMinutes ? `${data.readyInMinutes} min` : "",
                complexity: "moderate"
            });

            await newRecipe.save();
            return res.status(200).json({ recipe: newRecipe });
        }

        return res.status(404).json({ message: "Recipe not found." });

    } catch (error) {
        console.error("Error sharing recipe:", error);
        // Handle Spoonacular 404 explicitly
        if (error.response && error.response.status === 404) {
            return res.status(404).json({ message: "Recipe not found." });
        }
        res.status(500).json({ message: "Server error while sharing recipe." });
    }
});



// rate and unrate a recipe
router.post("/rate", isAuthenticated, async (req, res) => {
    const { recipeId, recipeName, recipeImage, rating } = req.body;
    const userId = req.id;

    console.log("🔧 Received rating request:", { recipeId, recipeName, recipeImage, rating });

    if (!userId || !recipeId || rating == null || !recipeName || !recipeImage) {
        console.log("❌ Missing fields");
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        if (rating >= 1) {
            await Rating.findOneAndUpdate(
                { userId, recipeId },
                { recipeName, recipeImage, rating },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            return res.status(200).json({ message: "Rating saved!" });
        } else {
            await Rating.findOneAndDelete({ userId, recipeId });
            return res.status(200).json({ message: "Rating removed!" });
        }
    } catch (err) {
        console.error("🔥 Server crash in /rate:", err);
        return res.status(500).json({ message: "Server error" });
    }
});

// get all ratings by logged-in user
router.get('/userratings', isAuthenticated, async (req, res) => {
    try {
        const rated = await Rating.find({ userId: req.id }).lean();

        const result = rated.map(r => ({
            recipeId: r.recipeId,
            name: r.recipeName,
            image: r.recipeImage,
            rating: r.rating,
        }));

        return res.json({ ratedRecipes: result });
    } catch (err) {
        console.error('Error fetching user ratings:', err);
        return res.status(500).json({ error: 'Server error' });
    }
});


export default router;
