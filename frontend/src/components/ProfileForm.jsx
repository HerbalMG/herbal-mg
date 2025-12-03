import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { getAuthToken, getUserInfo } from "../utils/tokenHelper";

// const API_BASE = "http://localhost:3001/api";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


export default function ProfileForm() {
  const navigate = useNavigate();
  
  // Get user info and token from localStorage
  const userInfo = getUserInfo() || {};
  const authToken = getAuthToken();
  const customerId = userInfo.id;
  
  // Check if user has default name (new user who hasn't updated profile)
  const isNewUser = !userInfo.name || userInfo.name === 'User';

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Basic profile state
  const [profile, setProfile] = useState({
    name: userInfo.name || '',
    email: userInfo.email || '',
    mobile: userInfo.mobile || '',
  });

  // Fetch user profile and addresses on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!authToken || !customerId) {
        toast.error("Please login first");
        navigate('/login');
        return;
      }

      try {
        // Fetch customer profile
        const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (profileResponse.data.success) {
          const profileData = profileResponse.data.data;
          setProfile({
            name: profileData.name || '',
            email: profileData.email || '',
            mobile: profileData.mobile || '',
          });
        }

        // Fetch addresses
        try {
          const addressResponse = await axios.get(`${API_BASE_URL}/customer/${customerId}/addresses`, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
          
          if (addressResponse.data) {
            // Handle both ApiResponse format and direct array format
            const rawData = addressResponse.data.data || addressResponse.data;
            const addressData = Array.isArray(rawData) ? rawData : [];
            setAddresses(addressData.map(addr => ({
              ...addr,
              fullName: addr.full_name || '',
              email: addr.email || '',
              contact: addr.contact || '',
              house_number: addr.address_line1?.split(',')[0]?.trim() || '',
              area: addr.address_line1?.split(',')[1]?.trim() || '',
              landmark: addr.address_line1?.split(',')[2]?.trim() || '',
              city: addr.city || '',
              state: addr.state || '',
              pinCode: addr.pincode || '',
              country: addr.country || 'India',
              isEditing: false,
              open: false
            })));
          }
        } catch (addrError) {
          console.log("No addresses found or error loading addresses");
          setAddresses([]);
        }
      } catch (error) {
        console.error("Failed to load profile data:", error);
        if (error.response?.status === 401) {
          toast.error("Session expired. Please login again");
          localStorage.clear();
          navigate('/login');
        } else {
          toast.error("Failed to load profile data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [customerId, authToken, navigate]);

  // Profile completion functions
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const completeProfile = async () => {
    if (!profile.name.trim() || profile.name.trim() === 'User') {
      toast.error('Please enter your name');
      return;
    }

    if (profile.email && !validateEmail(profile.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setProfileLoading(true);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/auth/profile`,
        {
          name: profile.name.trim(),
          email: profile.email.trim() || null,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      if (response.data.success) {
        // Update localStorage
        const updatedUser = {
          ...userInfo,
          name: profile.name.trim(),
          email: profile.email.trim() || userInfo.email
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Dispatch event to update navbar
        window.dispatchEvent(new Event('userLogin'));
        
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => /^[6-9]\d{9}$/.test(phone);
  const validatePinCode = (pin) => /^\d{6}$/.test(pin);

  const updateAddressState = (index, updates) => {
    setAddresses(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  };

  const handleFieldChange = (index, e) => {
    const { name, value } = e.target;
    updateAddressState(index, { [name]: value });
  };

  const toggleOpen = (index) => {
    updateAddressState(index, { open: !addresses[index].open });
  };

  const toggleEdit = (index) => {
    updateAddressState(index, { isEditing: true, open: true });
  };

  const saveAddress = async (index) => {
    const addr = addresses[index];
    
    // Validation
    if (!addr.fullName?.trim() || addr.fullName.trim().length < 3) {
      toast.error("Name must be at least 3 characters.");
      return false;
    }
    if (!validateEmail(addr.email)) {
      toast.error("Invalid email.");
      return false;
    }
    if (!validatePhone(addr.contact)) {
      toast.error("Invalid mobile number.");
      return false;
    }
    if (!addr.house_number?.trim()) {
      toast.error("House number is required.");
      return false;
    }
    if (!addr.area?.trim()) {
      toast.error("Area is required.");
      return false;
    }
    if (!addr.landmark?.trim()) {
      toast.error("Landmark is required.");
      return false;
    }
    if (!addr.state?.trim()) {
      toast.error("State is required.");
      return false;
    }
    if (!addr.city?.trim()) {
      toast.error("City is required.");
      return false;
    }
    if (!validatePinCode(addr.pinCode)) {
      toast.error("Invalid pin code.");
      return false;
    }
    if (!addr.country?.trim()) {
      toast.error("Country is required.");
      return false;
    }

    // Prepare payload for backend
    const payload = {
      full_name: addr.fullName,
      email: addr.email,
      contact: addr.contact,
      address_line1: `${addr.house_number}, ${addr.area}, ${addr.landmark}`,
      address_line2: '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pinCode,
      country: addr.country,
      is_default: addr.is_default || false,
    };

    try {
      let response;
      if (addr.id) {
        // Update existing address
        response = await axios.put(
          `${API_BASE_URL}/customer/${customerId}/addresses/${addr.id}`,
          payload,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        const updatedAddress = response.data.data || response.data;
        // Parse address_line1 back into components
        const addressParts = updatedAddress.address_line1?.split(',') || [];
        updateAddressState(index, { 
          ...updatedAddress,
          fullName: updatedAddress.full_name || '',
          email: updatedAddress.email || '',
          contact: updatedAddress.contact || '',
          house_number: addressParts[0]?.trim() || '',
          area: addressParts[1]?.trim() || '',
          landmark: addressParts[2]?.trim() || '',
          pinCode: updatedAddress.pincode || '',
          isEditing: false 
        });
        toast.success("Address updated!");
      } else {
        // Create new address
        response = await axios.post(
          `${API_BASE_URL}/customer/${customerId}/addresses`,
          payload,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        const newAddress = response.data.data || response.data;
        // Parse address_line1 back into components
        const addressParts = newAddress.address_line1?.split(',') || [];
        setAddresses(prev => prev.map((a, i) => 
          i === index ? { 
            ...newAddress,
            fullName: newAddress.full_name || '',
            email: newAddress.email || '',
            contact: newAddress.contact || '',
            house_number: addressParts[0]?.trim() || '',
            area: addressParts[1]?.trim() || '',
            landmark: addressParts[2]?.trim() || '',
            pinCode: newAddress.pincode || '',
            isEditing: false, 
            open: true 
          } : a
        ));
        toast.success("Address added!");
      }
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save address');
      return false;
    }
  };

  const handleRemove = async (index) => {
    const addr = addresses[index];
    if (!addr.id) {
      setAddresses(prev => prev.filter((_, i) => i !== index));
      return;
    }
    
    try {
      await axios.delete(
        `${API_BASE_URL}/customer/${customerId}/addresses/${addr.id}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setAddresses(prev => prev.filter((_, i) => i !== index));
      toast.success("Address removed");
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove address');
    }
  };

  const handleAdd = () => {
    if (addresses.length >= 2) {
      toast.error('Maximum 2 addresses allowed');
      return;
    }
    
    setAddresses(prev => [
      ...prev,
      {
        fullName: profile.name || '',
        email: profile.email || '',
        contact: profile.mobile || '',
        house_number: '',
        area: '',
        landmark: '',
        state: '',
        city: '',
        pinCode: '',
        country: 'India',
        isEditing: true,
        open: true,
      },
    ]);
  };

  const setDefault = async (index) => {
    const addr = addresses[index];
    if (!addr.id) return toast.error('Save address first!');
    
    try {
      await axios.post(
        `${API_BASE_URL}/customer/${customerId}/addresses/${addr.id}/set-default`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setAddresses(prev => prev.map((a, i) => ({ ...a, is_default: i === index })));
      toast.success('Default address set!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to set default address');
    }
  };

  const inputFields = [
    { label: "Name", name: "fullName", type: "text" },
    { label: "Email", name: "email", type: "email" },
    { label: "Mobile", name: "contact", type: "tel", maxLength: 10 },
    { label: "House No.", name: "house_number", type: "text" },
    { label: "Area", name: "area", type: "text" },
    { label: "Landmark", name: "landmark", type: "text" },
    { label: "State", name: "state", type: "text" },
    { label: "City", name: "city", type: "text" },
    { label: "Pin Code", name: "pinCode", type: "text", maxLength: 6 },
    { label: "Country", name: "country", type: "text" },
  ];

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen sm:p-6">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-md shadow-lg">
        {/* Profile Section */}
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-blue-800">
            {isNewUser ? 'Complete Your Profile' : 'Update Your Profile'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Full Name *
              </label>
              <input
                name="name"
                type="text"
                value={profile.name}
                onChange={handleProfileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your full name"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Email (Optional)
              </label>
              <input
                name="email"
                type="email"
                value={profile.email}
                onChange={handleProfileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Mobile Number
              </label>
              <input
                name="mobile"
                type="tel"
                value={profile.mobile}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">Mobile number cannot be changed</p>
            </div>
          </div>
          <button
            onClick={completeProfile}
            disabled={profileLoading || !profile.name.trim() || profile.name === 'User'}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              profileLoading || !profile.name.trim() || profile.name === 'User'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {profileLoading ? 'Updating...' : isNewUser ? 'Complete Profile' : 'Update Profile'}
          </button>
        </div>

        {/* Address Management Section */}
        <div>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4">
            Saved Delivery Addresses
          </h3>

          {addresses.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No addresses saved yet. Add your first address below.</p>
            </div>
          )}

          {addresses.map((addr, idx) => (
            <div
              key={addr.id || idx}
              className={`mb-4 border rounded-md overflow-hidden ${
                addr.is_default ? 'border-blue-500' : ''
              }`}
            >
              {/* Accordion Header */}
              <div
                className="flex justify-between items-center bg-gray-100 p-3 cursor-pointer"
                onClick={() => toggleOpen(idx)}
              >
                <h3 className="font-medium">
                  Address {idx + 1}: {addr.fullName || "(no name)"}{' '}
                  {addr.is_default && (
                    <span className="text-blue-600 text-xs ml-2">[Default]</span>
                  )}
                </h3>
                <span>{addr.open ? "▲" : "▼"}</span>
              </div>

              {/* Panel */}
              {addr.open && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {inputFields.map(({ label, name, type, maxLength }) => (
                      <div key={name}>
                        <label className="block mb-1 font-medium text-gray-700">
                          {label}
                        </label>
                        <input
                          name={name}
                          type={type}
                          maxLength={maxLength}
                          value={addr[name] || ''}
                          onChange={(e) => handleFieldChange(idx, e)}
                          readOnly={!addr.isEditing}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                            addr.isEditing
                              ? "border-blue-500 focus:ring-blue-300"
                              : "border-gray-300 bg-gray-100"
                          }`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3 justify-end">
                    {addr.isEditing ? (
                      <button
                        type="button"
                        onClick={() => saveAddress(idx)}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      >
                        Save
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleEdit(idx)}
                        className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                      Remove
                    </button>
                    {!addr.is_default && !addr.isEditing && addr.id && (
                      <button
                        type="button"
                        onClick={() => setDefault(idx)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="pt-2">
            {addresses.length < 2 ? (
              <button
                type="button"
                onClick={handleAdd}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                + Add Address
              </button>
            ) : (
              <div className="w-full bg-gray-100 text-gray-500 px-4 py-2 rounded text-center border-2 border-dashed border-gray-300">
                Maximum 2 addresses allowed. Please delete an address to add a new one.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
