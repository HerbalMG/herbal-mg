import { useRef, useState, useEffect } from "react";
import "./LogoCircles.css";
import { useNavigate } from "react-router-dom";
import { createSlug } from "../utils/slugUtils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


const Brands = () => {
  const scrollRef = useRef(null);
  const autoScrollInterval = useRef(null);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  // Fetch top brands only
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/brand/top`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch top brands");
        return res.json();
      })
      .then((data) => {
        setBrands(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Auto-scroll with pause on hover
  useEffect(() => {
    const startAutoScroll = () => {
      autoScrollInterval.current = setInterval(() => {
        if (isHovered || !scrollRef.current) return;
        const el = scrollRef.current;
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
          el.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          el.scrollBy({ left: 250, behavior: "smooth" });
        }
      }, 4000);
    };

    startAutoScroll();
    return () => clearInterval(autoScrollInterval.current);
  }, [isHovered]);

  // Touch swipe support
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let startX = 0;
    let isDown = false;

    const onTouchStart = (e) => {
      startX = e.touches[0].clientX;
      isDown = true;
    };

    const onTouchMove = (e) => {
      if (!isDown) return;
      const diff = startX - e.touches[0].clientX;
      el.scrollLeft += diff;
      startX = e.touches[0].clientX;
    };

    const onTouchEnd = () => {
      isDown = false;
    };

    el.addEventListener("touchstart", onTouchStart);
    el.addEventListener("touchmove", onTouchMove);
    el.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return (
    <div className="relative mt-3 max-w-full md:max-w-7xl mx-auto">
<h1 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-6 text-black">
        Shop by Brands
      </h1>

      {/* Scrollable area */}
      <div
        ref={scrollRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="flex gap-4 sm:gap-6 overflow-x-auto px-1 sm:px-4 no-scrollbar scroll-smooth"
        style={{ scrollSnapType: "x mandatory" }}
        aria-label="Carousel of Ayurvedic Brand Logos"
      >
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gray-200 animate-pulse"
              style={{ scrollSnapAlign: "center" }}
            />
          ))
        ) : error ? (
          <div className="flex items-center justify-center py-8 bg-yellow-50 rounded-lg border border-yellow-200 w-full">
            <div className="text-center px-4">
              <svg className="mx-auto h-12 w-12 text-yellow-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-sm font-semibold text-yellow-800 mb-1">Unable to Load Brands</h3>
              <p className="text-xs text-yellow-600 mb-3">We're having trouble connecting to our servers.</p>
              <button
                onClick={() => window.location.reload()}
                className="text-xs bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition duration-200"
              >
                Retry
              </button>
            </div>
          </div>
        ) : brands.length ? (
          brands.map((brand) => (
            <div
              key={brand.id}
              className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-white border shadow flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-300"
              style={{ scrollSnapAlign: "center" }}
              role="img"
              aria-label={`Brand logo of ${brand.name}`}
              title={brand.name}
              onClick={() => navigate(`/brand/${brand.slug || createSlug(brand.name)}`)}
            >
              <img
                src={brand.logo_url}
                alt={brand.name}
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                loading="lazy"
              />
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 w-full">
            <div className="text-center">
              <div className="text-4xl mb-4">🏷️</div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Brands Available</h3>
              <p className="text-gray-500 text-sm max-w-md">We're working on partnering with trusted brands. Check back soon for quality products from renowned manufacturers!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Brands;



export function PopularBrand() {
  const navigate = useNavigate();

  const dummyBrands = [
    { id: 1, name: "Herbal Life", logo_url: "https://via.placeholder.com/100?text=Brand+1" },
    { id: 2, name: "AyurCare", logo_url: "https://via.placeholder.com/100?text=Brand+2" },
    { id: 3, name: "NatureHeal", logo_url: "https://via.placeholder.com/100?text=Brand+3" },
    { id: 4, name: "GreenRoots", logo_url: "https://via.placeholder.com/100?text=Brand+4" },
    { id: 5, name: "AyushWell", logo_url: "https://via.placeholder.com/100?text=Brand+5" },
    { id: 6, name: "OrganicVeda", logo_url: "https://via.placeholder.com/100?text=Brand+6" },
  ];

  const createSlug = (name) => name.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="relative mt-3 max-w-full md:max-w-7xl mx-auto rounded-1xl">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-6 text-black">
        Popular Brands
      </h1>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
        {dummyBrands.map((brand) => (
          <div
            key={brand.id}
            className="text-center cursor-pointer"
            onClick={() => navigate(`/brand/${brand.slug || createSlug(brand.name)}`)}
          >
            <div className="w-full h-20 bg-white border shadow-md flex items-center justify-center transition-transform hover:scale-90 rounded-2xl">
              <img
                src={brand.logo_url}
                alt={brand.name}
                className="w-12 h-12 object-contain"
                loading="lazy"
              />
            </div>
            <div className="mt-2 text-sm font-medium text-gray-700 truncate">{brand.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}




