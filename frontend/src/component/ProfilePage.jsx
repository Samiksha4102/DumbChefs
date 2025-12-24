import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import RecipeCard from "./RecipeCard";

function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [savedRecipeSet, setSavedRecipeSet] = useState(new Set());
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSavedRecipes, setShowSavedRecipes] = useState(false);
  const [myRatings, setMyRatings] = useState([]);
  const [showMyRatings, setShowMyRatings] = useState(false);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);


  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (!storedUser || !storedToken) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [navigate]);

  // Fetch user's saved recipes
  const fetchSavedRecipes = async () => {
    setShowUpdateForm(false); // ✅ Hide update form
    setShowMyRatings(false); // hide ratings
    setShowSavedRecipes(true); // show saved recipes
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/recipes/saved`, {
        withCredentials: true,
      });

      const recipes = response.data.savedRecipes || [];
      setSavedRecipes(recipes);
      setSavedRecipeSet(new Set(recipes.map((r) => r.recipeId)));
    } catch (error) {
      console.error("Failed to fetch saved recipes:", error);
    }
  };

  const toggleSaveRecipe = async (recipe) => {
    const isAlreadySaved = savedRecipeSet.has(recipe.id);
    const url = isAlreadySaved
      ? `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/recipes/unsave`
      : `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/recipes/save`;

    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipeId: recipe.id,
        name: recipe.name,
        image: recipe.image,
      }),
    });

    if (response.ok) {
      const updated = new Set(savedRecipeSet);
      isAlreadySaved ? updated.delete(recipe.id) : updated.add(recipe.id);
      setSavedRecipeSet(updated);
    }
  };

  const fetchFullRecipe = (recipe) => {
    setSelectedRecipe({
      name: recipe.name,
      content: recipe.content || "No instructions available.",
      videoLink: recipe.videoLink || `https://www.youtube.com/results?search_query=${encodeURIComponent(recipe.name + " recipe")}`,
      orderLink: recipe.orderLink || `https://www.zomato.com/search?q=${encodeURIComponent(recipe.name)}`,
    });
    setLoading(false);
  };

  const handleMyRatings = async () => {
    setShowSavedRecipes(false); // hide saved
    setShowUpdateForm(false);   // ❗️ hide update profile
    setShowMyRatings(true);     // show ratings
    setLoadingRatings(true);

    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/recipes/userratings`, {
        withCredentials: true,
      });
      const rated = response.data.ratedRecipes || [];
      setMyRatings(rated);
    } catch (error) {
      console.error("Failed to fetch user ratings:", error);
    } finally {
      setLoadingRatings(false);
    }
  };


  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[#000000] text-white font-sans pd-2">
      {/* Sidebar */}
      <div className="w-60 bg-gradient-to-b from-orange-400 to-orange-500 flex flex-col justify-between p-4">
        {/* Logo / Avatar */}
        <div className="flex flex-col items-center gap-4">
          <a href="/HomePage">
            <img src="/logo.png" alt="Logo" className="h-20 w-auto" />
          </a>
          <div className="w-full flex flex-col gap-2 mt-4">
            <button onClick={() => navigate('/HomePage')} className="bg-[#3a260f] text-white py-2 px-4 rounded">Home Page </button>
            <button onClick={fetchSavedRecipes} className="bg-[#3a260f] text-white py-2 rounded">Saved</button>
            <button onClick={handleMyRatings} className="bg-[#3a260f] text-white py-2 rounded">Ratings</button>

            <button
              onClick={() => {
                setShowSavedRecipes(false);
                setShowMyRatings(false);
                setShowUpdateForm(true);
              }}
              className="bg-[#3a260f] text-white py-2 px-4 rounded"
            >
              Settings
            </button>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="bg-black text-white py-2 rounded w-full hover:bg-red-700 transition"
        >
          Log out
        </button>
      </div>

      {/* Right side (main content) */}
      <div className="flex-1 flex flex-col p-2 gap-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 text-white p-10 rounded-tr-3xl rounded-bl-3xl flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center text-4xl font-bold size-10">
              {user.username ? user.username[0].toUpperCase() : "U"}
            </div>
            <div>
              <h1 className="text-2xl font-bold">Welcome, {user.username}!!</h1>
              <p className="text-md font-light italic">Lazy but legendary in the kitchen</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 bg-yellow-200 text-black rounded-tl-3xl rounded-bl-3xl flex flex-col gap-6">
          {/* Saved Recipes Section */}

          {showSavedRecipes && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">My Saved Recipes </h2>
              {savedRecipes.length === 0 ? (
                <p className="text-gray-600">No saved recipes found.</p>
              ) : (
                <RecipeCard
                  recipes={savedRecipes.map((r) => ({
                    ...r,
                    id: r.recipeId,
                  }))}
                  savedRecipes={savedRecipeSet}
                  onCardClick={fetchFullRecipe}
                  onSaveClick={toggleSaveRecipe}
                />
              )}
            </div>
          )}

          {/* My Ratings Section */}
          {showMyRatings && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">My Ratings</h2>
              {loadingRatings ? (
                <p>Loading your ratings...</p>
              ) : myRatings.length === 0 ? (
                <p>You haven't rated any recipes yet.</p>
              ) : (
                <RecipeCard
                  recipes={myRatings.map((r) => ({
                    ...r,
                    id: r.recipeId,
                  }))}
                  ratings={myRatings.reduce((acc, r) => {
                    acc[r.recipeId] = r.rating;
                    return acc;
                  }, {})}
                  onCardClick={fetchFullRecipe}
                  savedRecipes={savedRecipeSet} // optional if you want bookmark icons here too
                // no onSaveClick since rating list likely does not support saving here
                />
              )}
            </div>
          )}

          {showUpdateForm && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Update Profile</h2>
              <UpdateProfileForm user={user} setUser={setUser} onCancel={() => setShowUpdateForm(false)} />
            </div>
          )}


        </div>
      </div>

      {/* Full Recipe Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50">
          <div className="bg-white text-black rounded-2xl shadow-lg max-w-2xl w-full p-6 overflow-y-auto max-h-[80vh] relative">
            <button
              onClick={() => setSelectedRecipe(null)}
              className="absolute top-4 right-4 text-2xl text-black hover:text-red-600 font-bold"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-0.5">{selectedRecipe.name}</h2>
            {loading ? (
              <p className="text-gray-500">⏳ Generating recipe...</p>
            ) : (
              <p className="whitespace-pre-line text-gray-700">{selectedRecipe.content}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



export function UpdateProfileForm({ user, setUser, onCancel }) {
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPasswordFields, setShowPasswordFields] = useState(false); // toggle for password

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [success]);


  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        username: user.username || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);


    if (showPasswordFields && formData.newPassword !== formData.confirmNewPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.put(
        `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/v1/user/update-profile`,
        {
          username: formData.username,
          email: formData.email,
          currentPassword: showPasswordFields ? formData.currentPassword : undefined,
          newPassword: showPasswordFields ? formData.newPassword : undefined,
        },
        { withCredentials: true }
      );

      if (res.status === 200) {
        const updatedUser = res.data.user;
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setSuccess("Updated successfully!");

        // reset password fields only
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        }));
        setShowPasswordFields(false);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        if (
          window.confirm(
            "Current password is incorrect. Would you like to reset your password?"
          )
        ) {
          window.location.href = "/forgot-password";
        }
      } else {
        setError(err.response?.data?.message || "Update failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-8">
      {/* Left box - current info */}
      <div className="bg-black shadow-md rounded-lg p-6 w-full md:w-1/2 text-white">
        <h3 className="text-lg font-semibold mb-4">Current Information</h3>
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email}</p>

        {/* Show password fields only if "Change Password" is clicked */}
        <div className="mt-7 ">
          {showPasswordFields ? (
            <>
              <label className="block mb-3">
                Current Password:
                <input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  required
                  className="w-full border p-2 rounded mt-1 text-black"
                />
              </label>

              <label className="block mb-3">
                New Password:
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  className="w-full border p-2 rounded mt-1 text-black"
                />
              </label>

              <label className="block mb-3">
                Confirm New Password:
                <input
                  type="password"
                  name="confirmNewPassword"
                  value={formData.confirmNewPassword}
                  onChange={handleChange}
                  required
                  className="w-full border p-2 rounded mt-1 text-black"
                />
              </label>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowPasswordFields(true)}
              className="bg-orange-600 text-white py-2 px-4 rounded pt"
            >
              Change Password
            </button>
          )}
        </div>
      </div>

      {/* Right box - update fields */}
      <div className="bg-black shadow-md rounded-lg p-6 w-full md:w-1/2 text-white">
        <h3 className="text-lg font-semibold mb-4">Edit Profile</h3>

        <label className="block mb-3">
          Username:
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded mt-1 text-black"
          />
        </label>

        <label className="block mb-3">
          Email:
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded mt-1 text-black"
          />
        </label>


        {error && <p className="text-red-600">{error}</p>}
        {success && <p className="text-green-600">{success}</p>}

        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-orange-600 text-white py-2 px-4 rounded"
          >
            {loading ? "Updating..." : "Update "}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="bg-orange-600 text-white py-2 px-4 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}


export default ProfilePage;
