// src/pages/RecipeSharePage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const RecipeSharePage = () => {
    const { id } = useParams();
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSharedRecipe = async () => {
            try {
                const res = await fetch(`process.env.REACT_APP_BACKEND_URL/api/recipes/${id}`);
                const data = await res.json();
                setRecipe(data.recipe);
            } catch (err) {
                console.error("Error fetching recipe:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSharedRecipe();
    }, [id]);

    if (loading) return <div className="text-white p-6">Loading recipe...</div>;
    if (!recipe) return <div className="text-white p-6">Recipe not found.</div>;

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <h1 className="text-3xl font-bold mb-4">{recipe.name}</h1>
            <img src={recipe.image} alt={recipe.name} className="w-full max-w-md mb-4" />
            <p>Ingredients: {recipe.ingredients?.join(", ")}</p>
            <p>Instructions: {recipe.instructions || "Instructions will be added soon."}</p>
        </div>
    );
};

export default RecipeSharePage;
