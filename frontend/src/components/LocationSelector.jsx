"use client";
import { useState, useEffect } from "react";
import { FaLocationDot, FaLeftLong, FaAnglesDown } from "react-icons/fa6";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


export default function LocationSelectorWithSidebar() {
  const [selectedPincode, setSelectedPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState(""); // input value
  const [searchQuery, setSearchQuery] = useState(""); // debounced API query
  const [results, setResults] = useState([]);

  // -------------------------
  // Detect Location (Auto)
  // -------------------------
  const detectUserLocation = async () => {
    setLoading(true);
    try {
      if (!("geolocation" in navigator)) return;

      const position = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
      );

      const { latitude, longitude } = position.coords;

      const res = await fetch(`${API_BASE_URL}/detect-location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: latitude, lon: longitude }),
      });

      const data = await res.json();
      if (data.pincode) {
        setSelectedPincode(data.pincode);
        localStorage.setItem("userPincode", data.pincode);
      }
    } catch (err) {
      // silently fail
    }
    setLoading(false);
  };

  // -------------------------
  // Load cached address
  // -------------------------
  useEffect(() => {
    const saved = localStorage.getItem("userPincode");
    if (saved) {
      setSelectedPincode(saved);
    } else {
      detectUserLocation();
    }
  }, []);

  // -------------------------
  // Debounced search effect
  // -------------------------
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      fetch(
        `${API_BASE_URL}/pincodes/${encodeURIComponent(
          searchQuery.trim()
        )}`
      )
        .then((res) => res.json())
        .then((data) => {
          setResults(Array.isArray(data) ? data : []);
        })
        .catch(() => setResults([]));
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // -------------------------
  // Debounce input to searchQuery
  // -------------------------
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // -------------------------
  // Handle Select Pincode
  // -------------------------
  const applyPincode = (pin) => {
    setSelectedPincode(pin);
    localStorage.setItem("userPincode", pin);
    setSidebarOpen(false);
    setSearchTerm(""); // clear input
  };

  return (
    <div className="flex flex-row gap-3 w-max items-center">
      {/* Delivery address */}
      <div className="flex flex-row gap-3">
        <div className="flex flex-col justify-between">
          <FaLocationDot className=" w-5 h-full" />
        </div>

        <div className="flex flex-col justify-between">
          <span className="text-gray-700 text-sm font-medium">
            Delivery address
          </span>

          <button
            className=" text-sm text-blue-500 flex items-center gap-2"
            onClick={() => setSidebarOpen(true)}
          >
            {selectedPincode ? (
              `Pincode: ${selectedPincode}`
            ) : (
              <>
                Select address <FaAnglesDown />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 z-50
          ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-4">
          <div className="flex flex-row items-center gap-2 mb-4">
            <button
              className="text-gray-500 hover:text-black"
              onClick={() => setSidebarOpen(false)}
            >
              <FaLeftLong size={22} />
            </button>
            <h2 className="text-lg font-semibold">Deliver to</h2>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search pincode or location..."
              className="border rounded p-2 w-full"
            />

            {searchTerm && results.length > 0 && (
              <div className="absolute z-10 w-full max-h-96 overflow-y-auto border rounded mt-1 bg-white">
                {results.map((loc, index) => (
  <div
    key={index}
    className="px-2 py-1 cursor-pointer hover:bg-blue-100 text-sm rounded"
    onClick={() => applyPincode(loc.Pincode)}
  >
    {loc.Name}, {loc.District}, {loc.State} - {loc.Pincode}
  </div>
))}

              </div>
            )}

            {searchTerm && results.length === 0 && (
              <div className="absolute z-10 w-full mt-1 p-2 text-sm text-gray-500 bg-white border rounded">
                No results found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-opacity-25 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

