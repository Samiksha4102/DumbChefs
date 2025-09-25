import React from "react";
import { FaBookmark } from "react-icons/fa";

const RecipeCard = ({ recipes, savedRecipes = new Set(), onCardClick, onSaveClick, ratings = {} }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {recipes.map((recipe) => (
        <div
          key={recipe.id}
          className="bg-black text-white rounded-lg shadow-md overflow-hidden transform transition hover:scale-105 relative flex flex-col"
          onClick={() => onCardClick(recipe)}
          style={{ height: "295px" }} // same fixed height
        >
          {/* Image + Bookmark */}
          <div className="relative flex-shrink-0">
            <img
              src={recipe.image}
              alt={recipe.name}
              className="w-full h-48 object-cover"
            />

            {/* Bookmark button (only show if onSaveClick exists) */}
            {onSaveClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSaveClick(recipe);
                }}
                className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full"
              >
                {savedRecipes.has(recipe.id) ? (
                  <FaBookmark className="text-yellow-400" />
                ) : (
                  <FaBookmark className="text-white" />
                )}
              </button>
            )}
          </div>

          {/* Recipe name and rating */}
          <div className="p-4 flex flex-col justify-between flex-grow">
            <h2
              className="text-lg font-semibold  mt-3 truncate text-center"
              title={recipe.name}
              style={{ minHeight: "3rem" }}
            >
              {recipe.name}
            </h2>

            {/* Show star rating if available */}
            {ratings[recipe.id] !== undefined && (
              <div className="flex items-center justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-xl ${
                      ratings[recipe.id] >= star ? "text-yellow-500" : "text-gray-300"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecipeCard;
