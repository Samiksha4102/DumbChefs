import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import NutritionCard from "./NutritionCard";

function SharedRecipePage() {
  const { recipeId } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNutrition, setShowNutrition] = useState(false);
  const [nutritionData, setNutritionData] = useState(null);

  // Use environment variable for backend URL, fallback to localhost:5000
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || "process.env.REACT_APP_BACKEND_URL";

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/recipes/share/${recipeId}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Recipe not found");
          throw new Error("Failed to load recipe");
        }
        const data = await res.json();
        setRecipe(data.recipe);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (recipeId) {
      fetchRecipe();
    }
  }, [recipeId, API_BASE_URL]);

  const fetchNutrition = async (recipeContent) => {
    try {
      const res = await fetch(`${API_BASE_URL}/nutrition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeContent }),
      });
      const data = await res.json();
      setNutritionData(data);
    } catch (err) {
      console.error("❌ Nutrition fetch error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-bold text-red-500 mb-4">Oops!</h1>
        <p className="text-xl text-gray-300 mb-8">{error}</p>
        <Link to="/" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition">
          Go Home
        </Link>
      </div>
    );
  }

  if (!recipe) return null;

  // Clean up content: remove ** markers
  const cleanContent = recipe.content ? recipe.content.replace(/\*\*/g, "") : "";

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Navbar / Header */}
      <nav className="p-6 border-b border-gray-800 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="DumbChefs Logo" className="h-10 w-auto" />
          <div className="text-2xl font-bold text-orange-500 tracking-wider">DumbChefs</div>
        </div>
        <Link to="/" className="text-gray-300 hover:text-white transition underline">
          Home
        </Link>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6 md:p-12">
        <div className="flex flex-col lg:flex-row gap-8 md:gap-12">

          {/* Left Column: Image */}
          <div className="lg:w-5/12">
            <div className="sticky top-8">
              <img
                src={recipe.image}
                alt={recipe.name}
                className="w-full h-auto rounded-3xl shadow-2xl object-cover aspect-square border-4 border-gray-900"
              />
              <div className="mt-6 flex flex-wrap gap-4 justify-center">
                {recipe.videoLink && (
                  <a
                    href={recipe.videoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center bg-transparent border-2 border-red-600 text-red-500 hover:bg-red-600 hover:text-white font-bold py-3 px-6 rounded-xl transition"
                  >
                    Watch Video
                  </a>
                )}
                {recipe.orderLink && (
                  <a
                    href={recipe.orderLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center bg-transparent border-2 border-green-600 text-green-500 hover:bg-green-600 hover:text-white font-bold py-3 px-6 rounded-xl transition"
                  >
                    Order Recipe
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="lg:w-7/12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-500 mb-6">
              {recipe.name}
            </h1>

            {/* Tags/Meta info if available in standard format, otherwise just content */}
            <div className="flex gap-4 mb-8 text-sm text-gray-400 font-mono flex-wrap">
              {recipe.cuisine && <span className="bg-gray-800 px-3 py-1 rounded-full">{recipe.cuisine}</span>}
              {recipe.mealType && <span className="bg-gray-800 px-3 py-1 rounded-full">{recipe.mealType}</span>}
              {recipe.cookingTime && <span className="bg-gray-800 px-3 py-1 rounded-full">⏱ {recipe.cookingTime}</span>}
            </div>

            <div className="bg-gray-900 bg-opacity-50 p-6 rounded-2xl border border-gray-800">
              <h2 className="text-xl font-bold text-gray-200 mb-4 border-b border-gray-700 pb-2">Instructions</h2>
              <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-line leading-relaxed">
                {cleanContent}
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={async () => {
                  if (!showNutrition && recipe.content && !nutritionData) {
                    await fetchNutrition(recipe.content);
                  }
                  setShowNutrition(prev => !prev);
                }}
                className="bg-gray-800 hover:bg-gray-700 text-white py-2 px-6 rounded-lg transition flex items-center gap-2"
              >
                {showNutrition ? "Hide Nutrition Info" : "Show Nutrition Info"}
              </button>

              {showNutrition && nutritionData && (
                <div className="mt-6 animate-fadeIn">
                  <NutritionCard data={nutritionData} />
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default SharedRecipePage;
