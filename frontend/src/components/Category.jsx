import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./LogoCircles.css";

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Category() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // console.log('🔄 Fetching categories from:', `${API_URL}/category`);
      const response = await fetch(`${API_BASE_URL}/category`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Fetched categories:', data.length);
      
      setCategories(data);
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      // Use fallback data
      setCategories([
        { id: 1, name: "Diabetes", slug: "diabetes", image_url: "/assets/diabetes.svg" },
        { id: 2, name: "Skin Care", slug: "skin-care", image_url: "/assets/skin.svg" },
        { id: 3, name: "Hair Care", slug: "hair-care", image_url: "/assets/hair.svg" },
        { id: 4, name: "Muscle Care", slug: "muscle-care", image_url: "/assets/joint.svg" },
        { id: 5, name: "Kidney Care", slug: "kidney-care", image_url: "/assets/Kidney.svg" },
        { id: 6, name: "Liver Care", slug: "liver-care", image_url: "/assets/liver.svg" },
        { id: 7, name: "Heart Care", slug: "heart-care", image_url: "/assets/heart.svg" },
        { id: 8, name: "Men Wellness", slug: "men-wellness", image_url: "/assets/men.svg" },
        { id: 9, name: "Women Wellness", slug: "women-wellness", image_url: "/assets/women.svg" },
        { id: 10, name: "Digestive Care", slug: "digestive-care", image_url: "/assets/digestive.svg" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-xl sm:text-3xl font-semibold mt-2 mb-4 text-black">
        Shop by Health Concern
      </h1>

      {/* Mobile Grid */}
      <div className="sm:hidden grid grid-cols-5 gap-2 px-2">
        {loading ? (
          Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="animate-pulse flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-300 rounded-full mb-2" />
              <div className="h-4 w-20 bg-gray-300 rounded" />
            </div>
          ))
        ) : (
          categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="flex flex-col items-center no-bg p-0"
              style={{ textDecoration: "none" }}
            >
              <img
                src={cat.image_url || "/assets/default-category.svg"}
                alt={cat.name}
                className="w-10 h-10 object-cover rounded-full"
                loading="lazy"
              />
              <p className="text-xs text-center text-gray-800">{cat.name}</p>
            </Link>
          ))
        )}
      </div>

      {/* Desktop Grid */}
      <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {loading ? (
          Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="animate-pulse bg-gray-200 rounded-md shadow-md h-20 flex items-center px-4"
            />
          ))
        ) : (
          categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="group flex items-center p-[2px] rounded-md"
            >
              <div className="flex items-center bg-white rounded-md shadow-md p-2 w-full group-hover:shadow-lg transition duration-300">
                <img
                  src={cat.image_url || "/assets/default-category.svg"}
                  alt={cat.name}
                  className="w-16 h-16 object-cover mr-4"
                  loading="lazy"
                />
                <p className="text-md font-semibold text-gray-800">{cat.name}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
