import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/database.js";
import userRoute from "./routes/userRoute.js";
import cookieParser from "cookie-parser";
import Groq from "groq-sdk";
import helmet from "helmet";
import axios from "axios";
import recipeRoute from "./routes/recipeRoute.js";
import imageRoute from "./routes/imageRoute.js";
import chatRoute from "./routes/chatRoute.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

// ========= Middleware ========= //
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

// ========= CORS setup ========= //
const corsOptions = {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
};
app.use(cors(corsOptions));

// =====CHatbot Route ====== //
app.use("/api", chatRoute);

// ========= Recipe Save Route ========= //
app.use("/api/recipes", recipeRoute);


// ========= User Routes ========= //
app.use("/api/v1/user", userRoute);

// Serve cached/generated images and proxy fetches
app.use("/images", imageRoute);



app.get("/recipesearch", async (req, res) => {
    const { ingredients = "", cuisine = "", diet = "", type = "", maxReadyTime = "" } = req.query;

    if (!ingredients.trim()) {
        return res.status(400).json({ error: "Ingredients are required" });
    }

    try {
        console.log("👩‍🍳 Generating recipes with Groq...");
        const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

        // 1. Ask Groq for recipes
        const prompt = `
            You are a creative chef. Generate a list of 5 to 15 unique recipes based on these details:
            - Ingredients: ${ingredients}
            - Cuisine: ${cuisine || "Any"}
            - Diet: ${diet || "Any"}
            - Meal Type: ${type || "Any"}
            - Max Time: ${maxReadyTime || "Any"} minutes

            Return ONLY a valid JSON array. Do not include markdown formatting (like \`\`\`json). 
            Each object must have: "title", "description".
            "description" should be a short, appetizing summary of the dish (max 2 sentences). Do NOT mention if you corrected spelling or assumed ingredients.
            Example: [{"title": "Spicy Chicken Curry", "description": "A rich indian curry..."}]
        `;

        const completion = await client.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        });

        const rawContent = completion.choices[0]?.message?.content || "[]";
        // Clean potential markdown code blocks if Groq adds them despite instructions
        const jsonString = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();

        let generatedRecipes = [];
        try {
            generatedRecipes = JSON.parse(jsonString);
        } catch (e) {
            console.error("Failed to parse Groq JSON:", rawContent);
            return res.json({ recipes: [] }); // Fallback to empty if AI fails
        }

        if (!Array.isArray(generatedRecipes)) generatedRecipes = [];

        console.log(`🤖 Groq generated ${generatedRecipes.length} recipes. Fetching images...`);

        // 2. Fetch food images from TheMealDB (free, no key) — run all in parallel
        const STOP_WORDS = new Set(['with','and','the','style','grilled','fried','baked','roasted','spicy','creamy','stuffed','smoked','crispy','stir','tossed','glazed','marinated','sauteed']);

        async function getMealImage(title, fallbackIndex) {
            // Build a list of keywords to try: words from recipe title + main ingredient
            const keywords = title
                .split(/[\s,\-]+/)
                .map(w => w.replace(/[^a-zA-Z]/g, ''))
                .filter(w => w.length > 3 && !STOP_WORDS.has(w.toLowerCase()));

            // Also try the main ingredient from the search
            const mainIngredient = (ingredients || '').split(',')[0].trim();
            if (mainIngredient && mainIngredient.length > 2 && !keywords.includes(mainIngredient)) {
                keywords.push(mainIngredient);
            }

            for (const keyword of keywords) {
                try {
                    const resp = await axios.get(
                        `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(keyword)}`,
                        { timeout: 5000 }
                    );
                    const meals = resp.data?.meals;
                    if (meals && meals.length > 0) {
                        return meals[0].strMealThumb;
                    }
                } catch (_) {}
            }

            // Final fallback: random food from TheMealDB using a letter search
            const letters = 'bcdfgprs';
            const letter = letters[fallbackIndex % letters.length];
            try {
                const resp = await axios.get(
                    `https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`,
                    { timeout: 5000 }
                );
                const meals = resp.data?.meals;
                if (meals && meals.length > 0) {
                    return meals[fallbackIndex % meals.length].strMealThumb;
                }
            } catch (_) {}

            return `https://picsum.photos/seed/food${fallbackIndex}/800/600`;
        }

        const recipesWithImages = await Promise.all(
            generatedRecipes.map(async (recipe, index) => {
                const imageUrl = await getMealImage(recipe.title, index);
                return {
                    id: `recipe-${Date.now()}-${index}`,
                    title: recipe.title,
                    name: recipe.title,
                    image: imageUrl,
                    thumb: imageUrl,
                    description: recipe.description
                };
            })
        );

        res.json({ recipes: recipesWithImages });

    } catch (error) {
        console.error("Recipe Search Error:", error);
        res.status(500).json({ error: "Failed to generate recipes." });
    }
});

// ========= Recipe Generator Route ========= //
app.get("/recipestream", async (req, res) => {
    const { ingredients, mealType, cuisine, cookingTime, complexity, name } = req.query;

    let prompt = [];

    // 🧠 If recipe name is provided, generate based on name only
    if (name && name.trim()) {
        prompt = [
            `Generate a detailed recipe for "${name}" but as short as possible`,
            "Include the following sections:",
            "- Recipe Name",
            "- Short Description",
            "- Ingredients List",
            "- Cooking Time",
            "- Servings",
            "- Preparation Steps",
            "- Cooking Steps (at least 200 words)",
            "- Nutritional Info (Calories, Protein, Carbs, Fat, Fiber)",
            "- If no authentic recipe is found, say: No authentic recipe found.",
        ];
    }
    // 🍳 Else, use ingredient-based generation
    else if (ingredients && ingredients.trim()) {
        prompt = [
            "Generate a recipe that incorporates the following details:",
            `[Ingredients: ${ingredients}]`,
            `[Meal type: ${mealType || "any"}]`,
            `[Cuisine preference: ${cuisine || "Indian"}]`,
            `[Cooking time: ${cookingTime || "least possible"}]`,
            `[Complexity: ${complexity || "easy"}]`,
            "Provide:- Recipe Name- Short Description- Ingredients (only from provided list)- Cooking Time- Servings- Preparation Steps- Cooking Steps, at least 200 words",

            "- Do NOT explicitly label the 'Short Description', just provide the text.",
            "- Do NOT mention if you corrected spelling errors.",
            "- If no authentic recipe is possible, say: No authentic recipe found with the given inputs."
        ];

    }
    // ❌ Neither name nor ingredients sent
    else {
        return res.status(400).json({ error: "Either recipe name or ingredients are required" });
    }

    const messages = [
        { role: "system", content: "You are a helpful chef assistant." },
        { role: "user", content: prompt.join("\n") },
    ];

    try {
        const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const aiModel = "llama-3.3-70b-versatile";

        const completion = await client.chat.completions.create({
            model: aiModel,
            messages,
            stream: true,
        });

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders?.();

        for await (const chunk of completion) {
            if (chunk.choices[0]?.delta?.content) {
                res.write(
                    `data: ${JSON.stringify({ action: "chunk", chunk: chunk.choices[0].delta.content })}\n\n`
                );
            }
            if (chunk.choices[0]?.finish_reason === "stop") {
                res.write(`data: ${JSON.stringify({ action: "close" })}\n\n`);
                res.end();
            }
        }
    } catch (err) {
        console.error("Groq API Error:", err);
        res.write(`data: ${JSON.stringify({ action: "error", error: err.message })}\n\n`);
        res.end();
    }

    req.on("close", () => res.end());
});


//====== Nutrition Analysis Route ======//

app.post("/nutrition", async (req, res) => {
    let { recipeContent } = req.body;

    if (!recipeContent || typeof recipeContent !== "string" || recipeContent.trim() === "") {
        return res.status(400).json({ error: "Recipe content is required" });
    }

    try {
        const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const aiModel = "llama-3.3-70b-versatile";

        const prompt = [
            "You are a nutrition expert.",
            `Given the following recipe, extract the list of ingredients and provide nutrition information (calories, protein, carbs, fat) for 1 serving:`,
            `"${recipeContent}"`,
            "Return a JSON object ONLY in this format, no extra text:",
            `{
        "totals": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0 },
        "breakdown": [
        { "ingredient": "example", "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }
        ]
    }`
        ];

        const messages = [
            { role: "system", content: "You are a helpful nutrition assistant." },
            { role: "user", content: prompt.join("\n") },
        ];

        const completion = await client.chat.completions.create({
            model: aiModel,
            messages,
            stream: false,
        });

        const aiResponse = completion.choices[0]?.message?.content || "";

        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error("No JSON found in AI response:", aiResponse);
            return res.status(500).json({ error: "Failed to parse nutrition data from AI" });
        }

        let nutritionData;
        try {
            nutritionData = JSON.parse(jsonMatch[0]);
        } catch (err) {
            console.error("Error parsing JSON:", err, "AI Response:", aiResponse);
            return res.status(500).json({ error: "Failed to parse nutrition data from AI" });
        }

        res.json(nutritionData);
    } catch (err) {
        console.error("Groq nutrition fetch error:", err);
        res.status(500).json({ error: "Failed to fetch nutrition from Groq" });
    }
});


// ========= Start Server ========= //
app.listen(PORT, async () => {
    try {
        await connectDB();
        console.log(`✅ Server is running on port ${PORT}`);
    } catch (err) {
        console.error("❌ Database connection failed:", err);
        process.exit(1);
    }
});



