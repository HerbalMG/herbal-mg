import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Navbar from "./components/Navbar";
import { CartProvider } from "./context/CartContext";
import AppRoutes from "./route/AppRoutes";
import Footer from "./components/Footer";
import GlobalLoader from "./components/GlobalLoader";
import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { FaWhatsapp } from "react-icons/fa";
import { useAuth } from "./hooks/useAuth";

function App() {
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  // Setup auto-logout functionality
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const interval = setInterval(() => {
      setFlipped((prev) => !prev);
    }, 3000); // Flip every 3 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Log authentication status
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('👤 User authenticated:', user.name);
    }
  }, [isAuthenticated, user]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-9">
        <img src="/start-logo.png" alt="Logo" className="h-25 w-35 mb-4 " />
        {/* <h1 className="text-2xl font-bold text-blue-600 tracking-wide">
          HerbalMG
        </h1> */}
      </div>
    );
  }

  return (
    <div>
      <Toaster position="top-right" reverseOrder={false} />
      <CartProvider>
        <div className="min-h-screen">
          <Navbar />
          <GlobalLoader />
          <main className="container mx-auto px-2 py-2">
            <AppRoutes />
          </main>
          <Footer />
        </div>
      </CartProvider>

<div className="block sm:hidden">
  

  {/* WhatsApp floating button */}
  <div
    className="fixed bottom-20 right-2 w-18 h-18 z-[9999] cursor-pointer"
  >
    <div
      className={`w-full h-full transition-transform duration-500 transform-style-preserve-3d relative ${
        flipped ? "rotate-y-180" : ""
      }`}
    >
      {/* Front */}
      <div className="absolute w-full h-full text-white p-4 rounded-full shadow-lg flex items-center justify-center backface-hidden bg-green-100">
        <img src="H.png" alt="logo" width={30} height={30} />
      </div>

      {/* Back */}
      <div className="absolute w-full h-full bg-green-100 text-black p-4 rounded-full shadow-lg flex items-center justify-center rotate-y-180 backface-hidden font-bold">
        <span className="text-sm text-center">Apni Pharmacy</span>
      </div>
    </div>
  </div>

</div>


      {/* Whatsapppppppppp  */}

      <a
        href="https://wa.me/3434534343"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-4 w-16 h-16 perspective z-50 hidden sm:block"
        aria-label="Contact us on WhatsApp"
      >
        <div
          className={`w-full h-full transition-transform duration-500 transform-style-preserve-3d relative ${
            flipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front side (WhatsApp icon) */}
          <div className="absolute w-full h-full bg-green-500 text-white p-4 rounded-full shadow-lg flex items-center justify-center backface-hidden hover:bg-green-600">
            <FaWhatsapp size={40} />
          </div>

          {/* Back side (Text) */}
          <div className="absolute w-full h-full bg-green-400 text-black font-semibold p-4 rounded-full shadow-lg flex items-center justify-center rotate-y-180 backface-hidden">
            <span className="text-sm text-center">Connect with us</span>
          </div>
        </div>
      </a>
    </div>
  );
}

export default App;
