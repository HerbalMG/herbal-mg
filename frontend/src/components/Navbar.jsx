"use client";
import {
  Navbar,
  NavBody,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "../components/ui/resizable-navbar";
import { useState, useEffect, useRef } from "react";
import { MdAddShoppingCart } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { FaLocationDot } from "react-icons/fa6";
import toast from "react-hot-toast";
import { FaHome, FaUser } from "react-icons/fa";
import { IoCall, IoLogOut } from "react-icons/io5";
import searchAnalytics from "../utils/searchAnalytics";
import NavbarSearch from "./NavbarSearch";
import NavbarSearchMobile from "./NavbarSearchMobile";
import { FaWhatsapp } from "react-icons/fa";
import { RiShoppingBag4Fill } from "react-icons/ri";

import LocationSelector from "./LocationSelector";



export default function NavbarMain() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cartItems } = useCart();
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        return {
          isLoggedIn: true,
          name: userData.name || null,
          mobile: userData.mobile || null,
          id: userData.id || null,
        };
      } catch (error) {
        console.error('Error parsing user data:', error);
        return { isLoggedIn: false, name: null };
      }
    }
    return { isLoggedIn: false, name: null };
  });

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const pincodeDropdownRef = useRef(null);
  const inputRef = useRef(null);

  const [locations, setLocations] = useState([]);
  const [selectedPincode, setSelectedPincode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [isPincodeDropdownOpen, setIsPincodeDropdownOpen] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // Get display name for user
  const getDisplayName = () => {
    if (!user.isLoggedIn) return 'Login';
    if (user.name && user.name.trim()) return user.name;
    return 'New User';
  };


  const cartItemCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen for user login/logout events
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser({
            isLoggedIn: true,
            name: userData.name || null,
            mobile: userData.mobile || null,
            id: userData.id || null,
          });
        } catch (error) {
          console.error('Error parsing user data:', error);
          setUser({ isLoggedIn: false, name: null });
        }
      } else {
        setUser({ isLoggedIn: false, name: null });
      }
    };

    // Listen for storage events (from other tabs)
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for same-tab updates
    window.addEventListener('userLogin', handleStorageChange);
    window.addEventListener('userLogout', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLogin', handleStorageChange);
      window.removeEventListener('userLogout', handleStorageChange);
    };
  }, []);


  return (
    <div className="relative w-full">
      <Navbar>
        <NavBody className="hidden md:flex flex-col items-stretch gap-2 ">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-6">
              <NavbarLogo />
              <LocationSelector isMobile={false} />
            </div>

            <div className="flex items-center gap-4">

              <NavbarButton as={Link} to="/cart" variant="secondary">
                <div className="flex items-center gap-2 text-lg">
                  <MdAddShoppingCart />
                  <span>{cartItemCount}</span>
                </div>
              </NavbarButton>

              {user.isLoggedIn ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-2 text-lg hover:text-blue-500"
                  >
                    {getDisplayName()}

      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>

    {isProfileDropdownOpen && (
      <div className="absolute right-0 mt-2 bg-white border rounded shadow-md z-50">
        <Link
          to="/profile"
          className="block w-full text-left px-4 py-2 text-md text-gray-700 hover:bg-gray-100"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setIsProfileDropdownOpen(false)}
        >
          Profile
        </Link>
        <Link
          to="/order-history"
          className="block w-full text-left px-4 py-2 text-md text-gray-700 hover:bg-gray-100"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setIsProfileDropdownOpen(false)}
        >
          Orders
        </Link>
        <button
          type="button"
          className="block w-full text-left px-4 py-2 text-md text-gray-700 hover:bg-gray-100"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => {
            setUser({ isLoggedIn: false, name: null });
            localStorage.removeItem("user");
            localStorage.removeItem("authToken");
            localStorage.removeItem("userPincode");
            setIsProfileDropdownOpen(false);
            window.dispatchEvent(new Event('userLogout'));
            navigate("/");
          }}
        >
          Logout
        </button>
      </div>
    )}
  </div>
) : (
  <NavbarButton
    as={Link}
    to="/login"
    variant="secondary"
    className=" p-3 bg-blue-700 text-white text-lg rounded-2xl"
  >
    Login
  </NavbarButton>
)}

            </div>
          </div>

        </NavBody>

        <div className="block md:hidden ">
          <MobileNav>
                        {/* <NavbarLogo /> */}

            <MobileNavHeader>
              <div className="flex flex-col w-full gap-2">
                

                <LocationSelector isMobile={true} />

                {/* Second Row: Search + Cart */}
                <div className="flex items-center gap-2 w-full">
                  <NavbarSearchMobile placeholder="Search medicines, brands..." />
                </div>

                {/* Error Message */}
                {searchError && (
                  <div className="text-red-500 text-xs">{searchError}</div>
                )}
              </div>
            </MobileNavHeader>

            
          </MobileNav>
        </div>
      </Navbar>
      {/* Bottom Navigation Bar - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden z-50 bg-white border-t rounded border-gray-200 shadow-lg">
        <div className="flex items-center justify-around py-2 px-2">
          <Link
            to="/"
            className="flex flex-col items-center gap-1 text-gray-600 hover:text-blue-600"
          >
            <FaHome className="w-5 h-5" />
            <span className="text-xs">Home</span>
          </Link>

          {user.isLoggedIn ? (
            <Link
              to="/order-history"
              className="flex flex-col items-center gap-1 text-gray-600 hover:text-blue-600 relative"
            >
              <RiShoppingBag4Fill className="w-5 h-5"/>            
              <span className="text-xs">Order</span>
            </Link>
          ) : (
            <Link
              to="/login-prompt"
              className="flex flex-col items-center gap-1 text-gray-600 hover:text-blue-600 relative"
            >
              <RiShoppingBag4Fill className="w-5 h-5"/>            
              <span className="text-xs">Order</span>
            </Link>
          )}

          <Link
            to="/cart"
            className="flex flex-col items-center gap-1 text-gray-600 hover:text-blue-600 relative"
          >
            <MdAddShoppingCart className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
            <span className="text-xs">Cart</span>
          </Link>

          <Link
            to={user.isLoggedIn ? "/profile" : "/login"}
            className="flex flex-col items-center gap-1 text-gray-600 hover:text-blue-600"
          >
            <FaUser className="w-5 h-5" />
            <span className="text-xs truncate max-w-[60px]">{getDisplayName()}</span>
          </Link>

          {user.isLoggedIn && (
            <button
              onClick={() => {
                setUser({ isLoggedIn: false, name: null });
                localStorage.removeItem("user");
                localStorage.removeItem("authToken");
                localStorage.removeItem("userPincode");
                window.dispatchEvent(new Event('userLogout'));
                navigate("/");
              }}
              className="flex flex-col items-center gap-1 text-gray-600 hover:text-red-600"
            >
              <IoLogOut className="w-5 h-5" />
              <span className="text-xs">Logout</span>
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
