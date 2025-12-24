import React from "react";

function OurServices() {
    const services = [
        {
            title: "Smart Recipe Suggestions",
            desc: "Enter your ingredients, and our AI creates delicious meal ideas.",
            img: "/images/OurServicePage/istockphoto-2200829710-1024x1024 (1).jpg"
        },
        {
            title: "Calorie & Nutrition Tracking",
            desc: "Stay on top of your health goals while enjoying food.",
            img: "/images/OurServicePage/calery and nutrition track.jpg"
        },
        {
            title: "Meal Customization",
            desc: "Adjust recipes based on taste, diet type (vegan, keto, etc.), or allergies.",
            img: "/images/OurServicePage/Meal Customization.jpg"
        },
        {
            title: "Ratings & Recommendations",
            desc: "Discover trending or highly-rated recipes.",
            img: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=800&q=80"
        },
        {
            title: "Favorites & Save Recipes",
            desc: "Bookmark your go-to dishes.",
            img: "/images/OurServicePage/Favorites & Save Recipes.jpg"
        },
    ];

    const future = ["Meal planning", "Grocery lists", "Step-by-step cooking assistant"];

    return (
        <>

            <div className="min-h-screen bg-gray-900 px-6 py-10 flex flex-col items-center text-white">
                {/* Back Button */}
                <nav className="w-full flex items-center p-4  ">
                    {/* Logo on left */}
                    <div className="flex items-center">
                        <img src="/logo.png" alt="Logo" className="h-12 w-auto" />
                        <div className="text-2xl font-bold"><a href="/"> DumbChefs </a></div>
                    </div>
                </nav>
                <div className="relative mb-10 w-full">
                    <h1 className="text-4xl font-extrabold text-white text-center">
                        Our <span className="text-yellow-400">Services</span>
                    </h1>
                </div>

                {/* Services Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full">
                    {services.map((service, index) => (
                        <div
                            key={index}
                            className="bg-gray-800 shadow-lg rounded-2xl overflow-hidden hover:shadow-yellow-500/30 hover:scale-[1.02] transition-all duration-300"
                        >
                            <img
                                src={service.img}
                                alt={service.title}
                                className="h-48 w-full object-cover"
                            />
                            <div className="p-5">
                                <h2 className="text-xl font-semibold text-yellow-400 mb-2">
                                    {service.title}
                                </h2>
                                <p className="text-gray-300">{service.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Future Add-ons */}
                <div className="mt-16 max-w-3xl w-full text-left bg-gray-800 shadow-lg rounded-xl p-6">
                    <h2 className="text-2xl font-semibold text-yellow-400 mb-4">
                        Future Add-ons
                    </h2>
                    <ul className="list-disc list-inside text-gray-300 space-y-2">
                        {future.map((item, idx) => (
                            <li key={idx} className="hover:text-yellow-300 transition">
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    );
}

export default OurServices;
