import React, { useState } from "react";
import { FiSearch } from "react-icons/fi";
import { FaUserCircle, FaRobot } from "react-icons/fa";
import { FaBookmark, FaShareAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import NutritionCard from "./NutritionCard.jsx";
import Chatbot from "./Chatbot.jsx";
import StarRating from "./StarRating.jsx";
import Toast from "./Toast.jsx";

function HomePage() {
    const [ingredients, setIngredients] = useState("");
    const [recipes, setRecipes] = useState([]);
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [savedRecipes, setSavedRecipes] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState(null);
    const [nutritionData, setNutritionData] = useState(null);
    const [showNutrition, setShowNutrition] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [showOnlyRecipes, setShowOnlyRecipes] = useState(false);
    const [recipeRatings, setRecipeRatings] = useState({});
    const [hasNoResults, setHasNoResults] = useState(false); // New state for tracking empty results
    const [toast, setToast] = useState(null); // { message, type }

    const showToast = (message, type = "info") => {
        setToast({ message, type });
    };

    const [selectedFilterOption, setSelectedFilterOption] = useState({
        Cuisine: "",
        Mealtype: "",
        Recipetime: "",
        Diet: "",
        Rating: "",
    });

    const filterOptions = {
        Cuisine: ["Indian", "Italian", "Chinese", "Mexican"],
        Mealtype: ["Breakfast", "Lunch", "Dinner", "Snack"],
        Recipetime: ["<30 min", "30-60 min", ">60 min"],
        Diet: ["Vegan", "Vegetarian", "Non-Veg", "Keto"],
        Rating: ["⭐ 1+", "⭐ 2+", "⭐ 3+", "⭐ 4+", "⭐ 5"],
    };

    // ===== Loading Spinner =====
    const Spinner = () => (
        <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-orange-500"></div>
        </div>
    );

    // ===== Component for Image with Loading State =====
    const ImageWithLoader = ({ src, alt }) => {
        const [loaded, setLoaded] = useState(false);

        return (
            <div className="w-full h-full relative bg-gray-800">
                {!loaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                    </div>
                )}
                <img
                    alt={alt}
                    src={src}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
                    onLoad={() => setLoaded(true)}
                />
            </div>
        );
    };

    // ===== Fetch nutrition info =====
    const fetchNutrition = async (recipeContent) => {
        try {
            const res = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/nutrition`, {
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


    // ===Share Recipes ==
    const handleShare = (recipe) => {
        // Enforce Save before Share
        if (!savedRecipes.has(recipe.id)) {
            showToast("Please save the recipe first to share it!", "warning");
            return;
        }

        // Construct URL with recipe ID
        const shareUrl = `${window.location.origin}/recipes/share/${recipe.id}`;

        if (navigator.share) {
            navigator.share({
                title: recipe.name,
                text: `Check out this recipe: ${recipe.name}`,
                url: shareUrl,
            }).catch((err) => console.error("Share failed:", err));
        } else {
            navigator.clipboard.writeText(shareUrl)
                .then(() => showToast("Link copied to clipboard!", "success"))
                .catch((err) => console.error("Clipboard error:", err));
        }
    };

    // ===== Fetch recipes list =====
    const handleGenerate = async () => {
        const trimmedIngredients = ingredients.trim();
        if (!trimmedIngredients) return;

        let maxReadyTime = "";
        switch (selectedFilterOption.Recipetime) {
            case "<30 min": maxReadyTime = "30"; break;
            case "30-60 min": maxReadyTime = "60"; break;
            case ">60 min": maxReadyTime = "180"; break;
            default: maxReadyTime = "";
        }

        try {
            setLoading(true);
            setHasNoResults(false); // Reset before new search

            const params = new URLSearchParams({
                ingredients: trimmedIngredients.split(",").map(i => i.trim()).join("\n") // ✅ use input ingredients directly
            });

            if (selectedFilterOption.Cuisine) params.append("cuisine", selectedFilterOption.Cuisine.trim());
            if (selectedFilterOption.Diet) params.append("diet", selectedFilterOption.Diet.trim());
            if (selectedFilterOption.Mealtype) params.append("type", selectedFilterOption.Mealtype.trim());
            if (maxReadyTime) params.append("maxReadyTime", maxReadyTime);

            const res = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/recipesearch?${params.toString()}`);
            const data = await res.json();

            if (data.recipes && data.recipes.length > 0) {
                setRecipes(data.recipes.map(r => ({
                    id: r.id,
                    name: r.title,
                    ingredientsList: trimmedIngredients.split(",").map(i => i.trim()), // ✅ store as array
                    image: r.image,
                    orderLink: `https://www.zomato.com/search?q=${encodeURIComponent(r.title)}`, // Zomato search link
                    videoLink: `https://www.youtube.com/results?search_query=${encodeURIComponent(r.title + " recipe")}` // YouTube search
                })));
                setShowOnlyRecipes(true);
            } else {
                setRecipes([]);
                setHasNoResults(true); // ✅ Set no results flag
            }
        } catch (err) {
            console.error("Error fetching recipes:", err);
            setRecipes([]);
            setHasNoResults(true);
        } finally {
            setLoading(false);
        }
    };

    // ==default filter values for cancel action
    const defaultFilterValues = {
        Cuisine: "",
        Mealtype: "",
        Recipetime: "",
        Diet: "",
        Rating: "",
    };

    // Helper to check if any filter is active
    const isAnyFilterActive = Object.values(selectedFilterOption).some(val => val !== "");

    // Clear all filters
    const clearFilters = () => {
        setSelectedFilterOption(defaultFilterValues);
        setActiveFilter(null);
        setHasNoResults(false); // clear error state
    };

    // ===== Save recipe =====
    const toggleSaveRecipe = async (recipe) => {
        const isAlreadySaved = savedRecipes.has(recipe.id);

        const url = isAlreadySaved
            ? `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/recipes/unsave`
            : `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/recipes/save`;

        const body = {
            recipeId: recipe.id,
            name: recipe.name,
            image: recipe.image,
        };

        // If saving (not unsaving), include full recipe details
        if (!isAlreadySaved) {
            body.content = recipe.content || "";
            body.ingredientsList = recipe.ingredientsList || [];
            body.videoLink = recipe.videoLink || "";
            body.orderLink = recipe.orderLink || "";
            body.cuisine = selectedFilterOption.Cuisine || "";
            body.mealType = selectedFilterOption.Mealtype || "";
            body.diet = selectedFilterOption.Diet || "";
            body.cookingTime = selectedFilterOption.Recipetime || "";
            body.complexity = "easy"; // default for now
        }

        const response = await fetch(url, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (response.ok) {
            setSavedRecipes((prev) => {
                const updated = new Set(prev);
                if (isAlreadySaved) {
                    updated.delete(recipe.id);
                    showToast("Recipe removed from saved.", "info");
                } else {
                    updated.add(recipe.id);
                    showToast("Recipe saved successfully!", "success");
                }
                return updated;
            });
        } else {
            showToast(data.message || "Failed to save recipe", "error");
        }
    };


    // ===== Handle star click for rating =====
    const handleRateRecipe = async (recipeId, rating, recipeName, recipeImage) => {
        try {
            const res = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/recipes/rate`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ recipeId, rating, recipeName, recipeImage }),
            });

            const data = await res.json();

            if (res.ok) {
                setRecipeRatings((prev) => ({ ...prev, [recipeId]: rating }));
            } else {
                alert(data.message || "Failed to save rating.");
            }
        } catch (err) {
            console.error("Rating error:", err);
            alert("Something went wrong while rating.");
        }
    };


    // ===== Fetch full recipe =====
    const fetchFullRecipe = async (recipe) => {
        setSelectedRecipe({
            id: recipe.id,
            name: recipe.name,
            image: recipe.image,
            content: "",
            ingredientsList: recipe.ingredientsList,
            videoLink: recipe.videoLink,
            orderLink: recipe.orderLink
        });

        setLoading(true);

        try {
            const params = new URLSearchParams({
                ingredients: recipe.ingredientsList.join("\n"),
                mealType: selectedFilterOption.Mealtype || "dinner",
                cuisine: selectedFilterOption.Cuisine || "Indian",
                diet: selectedFilterOption.Diet || "balanced",
                cookingTime: selectedFilterOption.Recipetime || "30 minutes",
                complexity: "easy",
            });

            const response = await fetch(
                `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/recipestream?${params}`,
                { method: "GET" }
            );

            if (!response.ok || !response.body)
                throw new Error("Failed to fetch recipe");

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let fullContent = "";

            const processLine = (line) => {
                if (line.startsWith("data:")) {
                    try {
                        const data = JSON.parse(line.replace("data:", "").trim());
                        if (data.action === "chunk" && data.chunk) {
                            fullContent += data.chunk;
                            setSelectedRecipe((prev) => ({
                                ...prev,
                                content: fullContent,
                            }));
                        }
                        if (data.action === "close") setLoading(false);
                    } catch (err) {
                        console.error("Error parsing line:", line, err);
                    }
                }
            };

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true }).trim().split("\n\n");
                chunk.forEach(processLine);
            }
        } catch (err) {
            console.error("Fetch recipe error:", err);
            setSelectedRecipe((prev) => ({
                ...prev,
                content: "⚠️ Failed to generate recipe. Please try again.",
            }));
        } finally {
            setLoading(false);
        }
    };




    return (
        <div className="min-h-screen bg-black text-white p-6 relative">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div >

                <div className={activeFilter ? "filter blur-sm" : ""}>
                    {/* Navbar & Search */}
                    <div className="flex items-center p-3 rounded-3xl max-w-8xl mx-auto pt-5">
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
                        </div>

                        <div className="flex items-center flex-grow mx-6 bg-slate-200 rounded-3xl rounded-tl-none rounded-br-none px-4 py-2">
                            <FiSearch className="text-gray-500 text-xl" />
                            <input
                                type="text"
                                placeholder="Search ingredients..."
                                value={ingredients}
                                onChange={(e) => setIngredients(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleGenerate();
                                }}
                                className="bg-transparent outline-none px-3 text-black w-full"
                            />
                            <button
                                onClick={handleGenerate}
                                className="ml-2 bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition"
                            >
                                Generate
                            </button>
                        </div>

                        <div className="flex gap-4 text-4xl text-white flex-shrink-0">
                            <Link to="/profilePage">
                                <FaUserCircle className="cursor-pointer hover:text-orange-500" />
                            </Link>
                            {/* ✅ Use FaRobot to toggle chatbot */}
                            <FaRobot
                                className="cursor-pointer hover:text-orange-500"
                                onClick={() => setIsChatOpen(true)}
                            />
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex justify-center gap-6 mt-8 flex-wrap items-center">
                        {Object.keys(filterOptions).map((btn, idx) => (
                            <button
                                key={idx}
                                className={`font-semibold py-3 px-8 rounded-xl text-lg transition-transform transform hover:scale-105 ${selectedFilterOption[btn] ? 'bg-orange-700 ring-2 ring-white' : 'bg-orange-500 hover:bg-orange-600'
                                    } text-white`}
                                onClick={() => setActiveFilter(btn)}
                            >
                                {btn} {selectedFilterOption[btn] && `: ${selectedFilterOption[btn]}`}
                            </button>
                        ))}

                        {/* Clear Filters Button */}
                        {isAnyFilterActive && (
                            <button
                                onClick={clearFilters}
                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition shadow-lg"
                            >
                                ✕ Clear Filters
                            </button>
                        )}
                    </div>

                    {/* No Results Feedback */}
                    {hasNoResults && !loading && (
                        <div className="mt-8 text-center bg-gray-900 bg-opacity-70 p-6 rounded-2xl max-w-2xl mx-auto border border-orange-500/30">
                            <h3 className="text-2xl font-bold text-orange-400 mb-2">No recipes found 😕</h3>
                            <p className="text-gray-300 mb-4">
                                We couldn't find any recipes for <strong>"{ingredients}"</strong> matching your filters.
                            </p>
                            <div className="flex flex-col gap-2 text-sm text-gray-400 bg-black/40 p-4 rounded-lg">
                                <span className="font-semibold text-gray-200">Active Filters:</span>
                                {isAnyFilterActive ? (
                                    <ul className="flex flex-wrap justify-center gap-2 mt-2">
                                        {Object.entries(selectedFilterOption).map(([key, val]) => (
                                            val && <li key={key} className="bg-gray-700 px-3 py-1 rounded-full border border-gray-600">{key}: <span className="text-orange-300">{val}</span></li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span>None</span>
                                )}
                            </div>
                            <button
                                onClick={clearFilters}
                                className="mt-6 bg-white text-black font-bold py-2 px-6 rounded-full hover:bg-gray-200 transition"
                            >
                                Reset all filters & Try again
                            </button>
                        </div>
                    )}

                    {/* Recipes Grid */}
                    {loading && <Spinner />}

                    {recipes.length > 0 && showOnlyRecipes && (
                        <div className="fixed inset-0 z-50 flex flex-col items-center justify-start bg-black bg-opacity-85 overflow-auto p-6">
                            <button
                                onClick={() => {
                                    setShowOnlyRecipes(false);
                                    setRecipes([]);
                                }}
                                className="mb-6 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl transition"
                            >
                                ← Home Page
                            </button>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
                                {recipes.map((recipe) => (
                                    <div
                                        key={recipe.id}
                                        onClick={() => fetchFullRecipe(recipe)}
                                        className="cursor-pointer rounded-lg overflow-hidden shadow-lg hover:scale-105 transform transition duration-300 flex flex-col"
                                        style={{ height: "300px" }}
                                    >
                                        <div className="w-full h-40 overflow-hidden flex-shrink-0 relative">
                                            {/* <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleSaveRecipe(recipe);
                                                }}
                                                className="absolute top-2 right-2 flex items-center justify-center text-white bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-80 transition"
                                            >
                                                {savedRecipes.has(recipe.id) ? (
                                                    <FaBookmark className="text-yellow-400" />
                                                ) : (
                                                    <FaBookmark className="text-white" />
                                                )}
                                            </button> */}
                                            <ImageWithLoader
                                                alt={recipe.name}
                                                src={recipe.image}
                                            />
                                        </div>
                                        <div className="flex flex-col bg-gray-800 p-4 flex-grow gap-0">
                                            <h2 className="text-lg font-bold text-white truncate">
                                                {recipe.name}
                                            </h2>

                                            <div className="flex justify-between mt-auto text-xl text-yellow-500 pt-0 gap-2 hover:text-white">
                                                <StarRating
                                                    recipeId={recipe.id}
                                                    initialRating={recipeRatings[recipe.id] || 0}
                                                    onRate={handleRateRecipe}
                                                    recipeName={recipe.name}
                                                    recipeImage={recipe.image}
                                                />


                                                {/* <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleShare(recipe);
                                                    }}
                                                    className="flex items-center gap-1 hover:text-white transition bg-black p-2 rounded-lg"
                                                >
                                                    <FaShareAlt />
                                                </button> */}
                                            </div>
                                        </div>

                                    </div>

                                ))}
                            </div>
                        </div>
                    )}


                    <div className="mt-10 space-y-10">
                        {/* Placeholder scrolling images */}
                        <div className="overflow-hidden relative max-w-6xl mx-auto h-60 md:h-64 my-6">
                            <div className="flex whitespace-nowrap animate-scroll-left">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                    <img
                                        key={i}
                                        src={`/images/HomePage/recipe${i}.jpg`}
                                        alt={`Recipe ${i}`}
                                        className="h-56 w-56 md:h-64 md:w-64 object-cover rounded-xl shadow-lg inline-block mr-6"
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="text-yellow-200 text-4xl text-center font-abril font-bold">
                            Adventure of Delicacies
                        </div>
                        <div className="overflow-hidden relative max-w-6xl mx-auto h-60 md:h-64 my-6">
                            <div className="flex whitespace-nowrap animate-scroll-right">
                                {[9, 10, 11, 12, 13, 14, 15, 16].map((i) => (
                                    <img
                                        key={`right-${i}`}
                                        src={`/images/HomePage/recipe${i}.jpg`}
                                        alt={`Recipe ${i}`}
                                        className="h-56 w-56 md:h-64 md:w-64 object-cover rounded-xl shadow-lg inline-block mr-6"
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="text-yellow-100 text-2xl text-center font-pacifo pt-3">
                            Unlock the world of culinary recipes and unleash your inner chef
                            the easy way with Flavoriz.
                        </div>
                    </div>

                </div>


                {/* Full Recipe Modal */}
                {selectedRecipe && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
                        <div className="bg-white text-black rounded-2xl shadow-xl max-w-5xl w-full p-6 overflow-y-auto max-h-[85vh] flex gap-6">
                            <div className="bg-white text-black rounded-2xl shadow-xl max-w-5xl w-full p-6 overflow-y-auto max-h-[85vh] flex gap-6 relative">
                                {/* Close button */}
                                <button
                                    onClick={() => {
                                        setSelectedRecipe(null);
                                        setShowNutrition(false);
                                        setNutritionData(null);
                                    }}
                                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-3xl font-bold"
                                    aria-label="Close"
                                >
                                    &times;
                                </button>

                                {/* Left: Recipe Image */}
                                <div className="w-1/2 relative">
                                    {/* Save Icon on top left of image */}
                                    <button
                                        onClick={() => toggleSaveRecipe(selectedRecipe)}
                                        className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 p-2 rounded-full text-yellow-400 hover:bg-opacity-80 transition"
                                        aria-label={savedRecipes.has(selectedRecipe.id) ? "Unsave recipe" : "Save recipe"}
                                    >
                                        {savedRecipes.has(selectedRecipe.id) ? (
                                            <FaBookmark className="text-yellow-400" />
                                        ) : (
                                            <FaBookmark className="text-white" />
                                        )}
                                    </button>

                                    <ImageWithLoader
                                        src={selectedRecipe.image}
                                        alt={selectedRecipe.name}
                                    />
                                </div>

                                {/* Right: Recipe Details */}
                                <div className="flex-1 flex flex-col">
                                    <h2 className="text-3xl font-bold mb-4">{selectedRecipe.name}</h2>
                                    {selectedRecipe.videoLink && (
                                        <a
                                            href={selectedRecipe.videoLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 underline"
                                        >
                                            📺 Watch Recipe Video
                                        </a>
                                    )}

                                    {loading ? (
                                        <p className="text-gray-500">⏳ Generating recipe...</p>
                                    ) : selectedRecipe.content ? (
                                        <>
                                            <p className="whitespace-pre-line text-gray-700 overflow-y-auto max-h-[300px]">
                                                {selectedRecipe.content.replace(/\*\*/g, "")}
                                            </p>

                                            {/* Links */}
                                            <div className="mt-4 flex gap-4">
                                                {selectedRecipe.orderLink && (
                                                    <a
                                                        href={selectedRecipe.orderLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-red-600 underline"
                                                    >
                                                        🍽️ Order on Zomato
                                                    </a>
                                                )}
                                            </div>

                                            {/* Nutrition Card */}
                                            {showNutrition && nutritionData && (
                                                <div className="mt-4 pb-2">
                                                    <NutritionCard data={nutritionData} />
                                                </div>
                                            )}

                                            {/* Show Nutrition and Share buttons at bottom */}
                                            {!loading && (
                                                <div className="mt-auto flex gap-4">
                                                    <button
                                                        onClick={async () => {
                                                            if (!showNutrition && selectedRecipe.content) {
                                                                await fetchNutrition(selectedRecipe.content);
                                                            }
                                                            setShowNutrition(prev => !prev);
                                                        }}
                                                        className="bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-600 flex items-center gap-1"
                                                        aria-label="Nutirition Info"
                                                    >
                                                        {showNutrition ? "Hide Nutrition" : "Show Nutrition"}
                                                    </button>


                                                    <button
                                                        onClick={() => handleShare(selectedRecipe)}
                                                        className="bg-yellow-400 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 flex items-center gap-1"
                                                        aria-label="Share Recipe"
                                                    >
                                                        <FaShareAlt /> Share
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-gray-400">No recipe generated yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}






                {/* Cooking Tips Section */}
                <div className="mt-16 max-w-3xl mx-auto bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-yellow-400 mb-4 text-center">
                        🍳 Cooking Tips
                    </h2>
                    <ul className="list-disc list-inside text-gray-300 space-y-2">
                        <li>Always taste your food while cooking and adjust seasonings accordingly.</li>
                        <li>Prep all ingredients before you start cooking for better results.</li>
                        <li>Fresh herbs should be added at the end of cooking for maximum flavor.</li>
                    </ul>
                </div>

                {/* Filter Overlay */}
                {activeFilter && (
                    <div className="fixed inset-0 z-50 flex justify-center items-start pt-40">
                        <div className="bg-white text-black p-6 rounded-xl shadow-lg">
                            <h3 className="text-xl font-bold mb-4">{activeFilter} Options</h3>
                            <div className="flex flex-col gap-3">
                                {filterOptions[activeFilter].map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => {
                                            setSelectedFilterOption((prev) => ({
                                                ...prev,
                                                [activeFilter]: option,
                                            }));
                                            setActiveFilter(null);
                                        }}
                                        className="py-2 px-4 rounded-lg hover:bg-orange-500 hover:text-white transition"
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedFilterOption((prev) => ({
                                        ...prev,
                                        [activeFilter]: defaultFilterValues[activeFilter] || "",
                                    }));
                                    setActiveFilter(null);
                                }}
                                className="mt-4 text-red-500 hover:underline"
                            >
                                Cancel
                            </button>

                        </div>
                    </div>
                )}




                {/* ✅ Chatbot Window (modal style) */}
                {isChatOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="relative w-full max-w-lg">
                            <Chatbot onClose={() => setIsChatOpen(false)} />
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default HomePage;
