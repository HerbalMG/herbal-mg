import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import PaymentButton from '../components/Payment/PaymentButton';
import TestPaymentButton from '../components/Payment/TestPaymentButton';
import CartTest from '../components/CartTest';
import toast from 'react-hot-toast';
import axios from 'axios';
import { getAuthToken, getUserInfo } from '../utils/tokenHelper';

// const API_BASE = "http://localhost:3001/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, getTotalItems, getSubtotal } = useCart();
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(1);
  
  // Saved addresses from database
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  
  // Form states
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });
  
  const [deliveryOption, setDeliveryOption] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('phonepe');
  const [orderNotes, setOrderNotes] = useState('');
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [prescriptionUrl, setPrescriptionUrl] = useState('');
  const [uploadingPrescription, setUploadingPrescription] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(true);
  
  const hasCheckedAuth = useRef(false);
  
  // Check if any product requires prescription
  const requiresPrescription = cartItems.some(item => item.prescription_required === true);
  
  // Check if prescription is already uploaded (from product details page)
  const existingPrescriptionUrl = cartItems.find(item => item.prescription_url)?.prescription_url;
  
  // Use existing prescription URL if available
  useEffect(() => {
    if (existingPrescriptionUrl && !prescriptionUrl) {
      setPrescriptionUrl(existingPrescriptionUrl);
    }
  }, [existingPrescriptionUrl]);

  // Delivery charges
  const deliveryCharges = {
    standard: 0,
    express: 50,
  };

  useEffect(() => {
    // Prevent multiple auth checks
    if (hasCheckedAuth.current) {
      return;
    }
    
    // Check if user is logged in
    const authToken = getAuthToken();
    const user = getUserInfo() || {};
    
    if (!authToken || !user.id) {
      hasCheckedAuth.current = true;
      toast.error('Please login to continue with checkout');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    
    hasCheckedAuth.current = true;

    // Load user data and saved addresses from database
    const loadUserData = async () => {
      try {
        const user = getUserInfo() || {};
        const authToken = getAuthToken();
        const customerId = user.id;

        // Fetch saved addresses from database
        if (authToken && customerId) {
          try {
            const addressResponse = await axios.get(
              `${API_BASE_URL}/customer/${customerId}/addresses`,
              { headers: { Authorization: `Bearer ${authToken}` } }
            );

            if (addressResponse.data) {
              const rawData = addressResponse.data.data || addressResponse.data;
              const addresses = Array.isArray(rawData) ? rawData : [];
              setSavedAddresses(addresses);

              // Auto-select default address or first address
              const defaultAddr = addresses.find(addr => addr.is_default);
              const selectedAddr = defaultAddr || addresses[0];
              
              if (selectedAddr) {
                setSelectedAddressId(selectedAddr.id);
                setShippingAddress({
                  fullName: selectedAddr.full_name || user.name || '',
                  phone: selectedAddr.contact || user.mobile || '',
                  email: selectedAddr.email || user.email || '',
                  address: selectedAddr.address_line1 || '',
                  city: selectedAddr.city || '',
                  state: selectedAddr.state || '',
                  pincode: selectedAddr.pincode || '',
                  landmark: selectedAddr.address_line2 || ''
                });
              } else {
                // No saved addresses, show new address form
                setShowNewAddressForm(true);
                setShippingAddress({
                  fullName: user.name || '',
                  phone: user.mobile || '',
                  email: user.email || '',
                  address: '',
                  city: '',
                  state: '',
                  pincode: '',
                  landmark: ''
                });
              }
            }
          } catch (addrError) {
            console.log('No saved addresses found');
            setShowNewAddressForm(true);
            setShippingAddress({
              fullName: user.name || '',
              phone: user.mobile || '',
              email: user.email || '',
              address: '',
              city: '',
              state: '',
              pincode: '',
              landmark: ''
            });
          }
        } else {
          // User not logged in - redirect to login
          toast.error('Please login to continue');
          navigate('/login', { state: { from: '/checkout' } });
          return;
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        if (error.response?.status === 401) {
          toast.error('Session expired. Please login again');
          localStorage.clear();
          navigate('/login');
        } else {
          toast.error('Error loading user data');
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []); // Empty dependency array - only run once on mount

  const handleAddressChange = (field, value) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSelectAddress = (address) => {
    setSelectedAddressId(address.id);
    setShippingAddress({
      fullName: address.full_name || '',
      phone: address.contact || '',
      email: address.email || '',
      address: address.address_line1 || '',
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || '',
      landmark: address.address_line2 || ''
    });
    setShowNewAddressForm(false);
  };

  const handleAddNewAddress = () => {
    if (savedAddresses.length >= 2) {
      toast.error('Maximum 2 addresses allowed. Please delete an address to add a new one.');
      return;
    }
    
    setSelectedAddressId(null);
    setShowNewAddressForm(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setShippingAddress({
      fullName: user.name || '',
      phone: user.mobile || '',
      email: user.email || '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      landmark: ''
    });
  };

  const saveAddress = async () => {
    // Always save to localStorage
    localStorage.setItem('shippingAddress', JSON.stringify(shippingAddress));
    
    // If user is logged in and wants to save address, save to database
    const user = getUserInfo() || {};
    const authToken = getAuthToken();
    const customerId = user.id;
    
    if (authToken && customerId && showNewAddressForm && !selectedAddressId && saveAddressToProfile) {
      try {
        // Check if user already has 2 addresses
        if (savedAddresses.length >= 2) {
          toast.error('Maximum 2 addresses allowed. Address saved for this order only.');
          return;
        }
        
        // Prepare address payload
        const addressPayload = {
          full_name: shippingAddress.fullName,
          email: shippingAddress.email || user.email,
          contact: shippingAddress.phone,
          address_line1: shippingAddress.address,
          address_line2: shippingAddress.landmark || '',
          city: shippingAddress.city,
          state: shippingAddress.state,
          pincode: shippingAddress.pincode,
          country: 'India',
          is_default: savedAddresses.length === 0 // First address is default
        };
        
        // Save to database
        const response = await axios.post(
          `${API_BASE_URL}/customer/${customerId}/addresses`,
          addressPayload,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        if (response.data) {
          const newAddress = response.data.data || response.data;
          setSavedAddresses(prev => [...prev, newAddress]);
          setSelectedAddressId(newAddress.id);
          setShowNewAddressForm(false);
          toast.success('✅ Address saved to your profile!');
        }
      } catch (error) {
        console.error('Error saving address:', error);
        // Don't show error to user, just save to localStorage
        toast.success('Address saved for this order');
      }
    } else {
      toast.success('Address saved for this order');
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return cartItems.length > 0;
      case 2:
        return shippingAddress.fullName && 
               shippingAddress.phone && 
               shippingAddress.address && 
               shippingAddress.city && 
               shippingAddress.pincode;
      case 3:
        // Check if prescription is required and uploaded
        if (requiresPrescription && !prescriptionUrl) {
          toast.error('Please upload prescription for prescription-required products');
          return false;
        }
        if (!deliveryOption) {
          toast.error('Please select a delivery option');
          return false;
        }
        return true;
      case 4:
        return paymentMethod && agreeToTerms;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => Math.min(prev + 1, 4));
      if (activeStep === 2) saveAddress();
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setActiveStep(prev => Math.max(prev - 1, 1));
  };

  const handlePaymentInitiated = (response) => {
    localStorage.setItem('pendingPayment', JSON.stringify({
      merchantTransactionId: response.merchantTransactionId,
      orderId: response.payment.order_id,
      amount: response.payment.amount,
      shippingAddress,
      deliveryOption,
      orderNotes
    }));
  };

  const handlePrescriptionUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) { // 3MB limit
        toast.error('File size should be less than 3MB');
        return;
      }
      
      setPrescriptionFile(file);
      setUploadingPrescription(true);
      
      try {
        // Upload file to server
        const formData = new FormData();
        formData.append('image', file);
        formData.append('folderType', 'prescription');
        
        const response = await axios.post(`${API_BASE}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data.imageUrl) {
          setPrescriptionUrl(response.data.imageUrl);
          toast.success('Prescription uploaded successfully');
        }
      } catch (error) {
        console.error('Prescription upload error:', error);
        toast.error('Failed to upload prescription. Please try again.');
        setPrescriptionFile(null);
      } finally {
        setUploadingPrescription(false);
      }
    }
  };

  const getDeliveryCharge = () => deliveryCharges[deliveryOption] || 0;
  const getFinalTotal = () => getSubtotal() + getDeliveryCharge();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!cartItems.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some products to your cart to proceed with checkout</p>
          
          {/* Test component for development */}
          <div className="mb-6">
            <CartTest />
          </div>
          
          <button
            onClick={() => navigate('/products')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-2 sm:py-4 lg:py-8">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        {/* Progress Steps */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex items-center justify-center overflow-x-auto">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-shrink-0">
                <div className={`
                  w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium
                  ${activeStep >= step 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`
                    w-8 sm:w-12 lg:w-16 h-0.5 sm:h-1 mx-1 sm:mx-2
                    ${activeStep > step ? 'bg-green-600' : 'bg-gray-200'}
                  `}></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <div className="text-xs sm:text-sm text-gray-600 text-center px-2">
              {activeStep === 1 && 'Review Cart'}
              {activeStep === 2 && 'Shipping Address'}
              {activeStep === 3 && 'Delivery Options'}
              {activeStep === 4 && 'Payment'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 order-1 lg:order-1">
            <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 lg:p-6">
              
              {/* Step 1: Cart Review */}
              {activeStep === 1 && (
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">Review Your Order</h2>
                  <div className="space-y-4">
                    {cartItems.map((item, index) => (
                      // <div key={index} className="flex flex-row items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
                      //   <img
                      //     src={item.image}
                      //     alt={item.name}
                      //     className="w-16 h-16 sm:w-24 sm:h-24 object-cover rounded"
                      //   />
                      //   <div className="flex-grow">
                      //     <h3 className="text-sm sm:text-base">{item.name}</h3>
                      //     <div className="text-gray-600 text-xs sm:text-sm flex items-center gap-2">
                      //       <span className="font-bold text-gray-900">₹{Number(item.price).toFixed(2)}</span>
                      //       {item.actual_price && Number(item.actual_price) > Number(item.price) && (
                      //         <>
                      //           <span className="line-through text-gray-400 text-xs">₹{Number(item.actual_price).toFixed(2)}</span>
                      //           <span className="text-green-600 text-xs font-semibold ml-1">
                      //             -{Math.round(((Number(item.actual_price) - Number(item.price)) / Number(item.actual_price)) * 100)}%
                      //           </span>
                      //         </>
                      //       )}
                      //     </div>
                      //     <div className="flex items-center gap-2 mt-1">
                      //       <span className="text-xs sm:text-sm text-gray-600">Qty: {item.quantity}</span>
                      //       {item.size && <span className="text-xs sm:text-sm text-gray-600">• Size: {item.size}</span>}
                      //     </div>
                      //   </div>
                      //   <div className="text-right">
                      //     <p className="font-semibold text-gray-800 text-sm sm:text-base">
                      //       ₹{(item.price * item.quantity).toFixed(2)}
                      //     </p>
                      //   </div>
                      // </div>
                      <div
  key={index}
  className="flex items-center gap-4 p-3 border rounded-lg hover:shadow-sm transition-shadow"
>
  {/* Product Image */}
  <img
    src={item.image}
    alt={item.name}
    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded"
  />

  {/* Product Info */}
  <div className="flex flex-col justify-center">
    {/* Name */}
    <h3 className="text-sm sm:text-base font-medium text-gray-900">{item.name}</h3>

    {/* Price & Discount */}
    <div className="flex items-center gap-2 mt-1">
      <span className="text-gray-900 font-semibold text-sm sm:text-base">₹{Number(item.price).toFixed(2)}</span>
      {item.actual_price && Number(item.actual_price) > Number(item.price) && (
        <>
          <span className="line-through text-gray-400 text-xs sm:text-sm">₹{Number(item.actual_price).toFixed(2)}</span>
          <span className="text-green-600 font-semibold text-xs sm:text-sm">
            -{Math.round(((Number(item.actual_price) - Number(item.price)) / Number(item.actual_price)) * 100)}%
          </span>
        </>
      )}
    </div>

    {/* Optional: Qty & Size */}
    <div className="text-gray-600 text-xs sm:text-sm mt-1">
      Qty: {item.quantity} {item.size && `• Size: ${item.size}`}
      {item.prescription_required && (
        <span className="ml-2 inline-flex items-center gap-1 text-red-600 font-semibold">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Prescription Required
        </span>
      )}
    </div>
  </div>
</div>

                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Shipping Address */}
              {activeStep === 2 && (
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">Shipping Address</h2>
                  
                  {/* Saved Addresses */}
                  {savedAddresses.length > 0 && !showNewAddressForm && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Select a saved address</h3>
                      <div className="space-y-3">
                        {savedAddresses.map((addr) => (
                          <div
                            key={addr.id}
                            onClick={() => handleSelectAddress(addr)}
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                              selectedAddressId === addr.id
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-300 hover:border-green-300'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <input
                                    type="radio"
                                    checked={selectedAddressId === addr.id}
                                    onChange={() => handleSelectAddress(addr)}
                                    className="text-green-600"
                                  />
                                  <h4 className="font-medium text-gray-900">
                                    {addr.full_name}
                                    {addr.is_default && (
                                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                        Default
                                      </span>
                                    )}
                                  </h4>
                                </div>
                                <p className="text-sm text-gray-600 ml-6">
                                  {addr.address_line1}
                                  {addr.address_line2 && `, ${addr.address_line2}`}
                                </p>
                                <p className="text-sm text-gray-600 ml-6">
                                  {addr.city}, {addr.state} - {addr.pincode}
                                </p>
                                <p className="text-sm text-gray-600 ml-6">
                                  Phone: {addr.contact}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {savedAddresses.length < 2 ? (
                        <button
                          onClick={handleAddNewAddress}
                          className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors"
                        >
                          + Add New Address
                        </button>
                      ) : (
                        <div className="mt-4 w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-center bg-gray-50">
                          Maximum 2 addresses allowed. Please delete an address to add a new one.
                        </div>
                      )}
                    </div>
                  )}

                  {/* New Address Form */}
                  {(showNewAddressForm || savedAddresses.length === 0) && (
                    <div>
                      {savedAddresses.length > 0 && (
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-medium text-gray-700">Add New Address</h3>
                          <button
                            onClick={() => {
                              setShowNewAddressForm(false);
                              if (savedAddresses.length > 0) {
                                handleSelectAddress(savedAddresses[0]);
                              }
                            }}
                            className="text-sm text-green-600 hover:text-green-700"
                          >
                            ← Back to saved addresses
                          </button>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            value={shippingAddress.fullName}
                            onChange={(e) => handleAddressChange('fullName', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            value={shippingAddress.phone}
                            onChange={(e) => handleAddressChange('phone', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={shippingAddress.email}
                            onChange={(e) => handleAddressChange('email', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                            Address *
                          </label>
                          <textarea
                            value={shippingAddress.address}
                            onChange={(e) => handleAddressChange('address', e.target.value)}
                            rows="3"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                            City *
                          </label>
                          <input
                            type="text"
                            value={shippingAddress.city}
                            onChange={(e) => handleAddressChange('city', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                            State *
                          </label>
                          <input
                            type="text"
                            value={shippingAddress.state}
                            onChange={(e) => handleAddressChange('state', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                            Pincode *
                          </label>
                          <input
                            type="text"
                            value={shippingAddress.pincode}
                            onChange={(e) => handleAddressChange('pincode', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                            Landmark
                          </label>
                          <input
                            type="text"
                            value={shippingAddress.landmark}
                            onChange={(e) => handleAddressChange('landmark', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      </div>
                      
                      {/* Save to Profile Checkbox - Only show for logged-in users adding new address */}
                      {JSON.parse(localStorage.getItem('user') || '{}').id && showNewAddressForm && !selectedAddressId && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <label className="flex items-start cursor-pointer">
                            <input
                              type="checkbox"
                              checked={saveAddressToProfile}
                              onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                              className="mt-1 mr-2"
                            />
                            <div>
                              <span className="text-sm font-medium text-gray-800">
                                Save this address to my profile
                              </span>
                              <p className="text-xs text-gray-600 mt-1">
                                You can manage saved addresses in your profile (max 2 addresses)
                              </p>
                            </div>
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Delivery Options */}
              {activeStep === 3 && (
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">Delivery Options</h2>
                  <div className="space-y-3 sm:space-y-4">
                    {[
                      { id: 'standard', name: 'Standard Delivery', time: '5-7 business days', price: 0 },
                      { id: 'express', name: 'Express Delivery', time: '2-3 business days', price: 50 },
                    ].map((option) => (
                      <div key={option.id} className="border rounded-lg p-3 sm:p-4">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="delivery"
                            value={option.id}
                            checked={deliveryOption === option.id}
                            onChange={(e) => setDeliveryOption(e.target.value)}
                            className="mr-2 sm:mr-3"
                          />
                          <div className="flex-grow">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                              <div className="mb-2 sm:mb-0">
                                <h3 className="font-medium text-gray-800 text-sm sm:text-base">{option.name}</h3>
                                <p className="text-xs sm:text-sm text-gray-600">{option.time}</p>
                              </div>
                              <div className="text-left sm:text-right">
                                <p className="font-semibold text-gray-800 text-sm sm:text-base">
                                  {option.price === 0 ? 'Free' : `₹${option.price}`}
                                </p>
                              </div>
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Prescription Upload */}
                  <div className={`mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg border ${
                    requiresPrescription && !prescriptionUrl
                      ? 'bg-red-50 border-red-300' 
                      : prescriptionUrl
                      ? 'bg-green-50 border-green-300'
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <h3 className="font-medium text-gray-800 mb-2 text-sm sm:text-base">
                      Upload Prescription {requiresPrescription && !prescriptionUrl && <span className="text-red-600">*</span>}
                      {prescriptionUrl && <span className="text-green-600 ml-2">✓ Uploaded</span>}
                    </h3>
                    
                    {/* Show if prescription already uploaded from product page */}
                    {prescriptionUrl && !prescriptionFile && (
                      <div className="mb-3 p-3 bg-white rounded-lg border border-green-300">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-800">
                              Prescription already uploaded
                            </p>
                            <p className="text-xs text-green-600">
                              You uploaded this prescription when adding the product to cart
                            </p>
                          </div>
                          <a 
                            href={prescriptionUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm underline"
                          >
                            View
                          </a>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs sm:text-sm text-gray-600 mb-3">
                      {requiresPrescription && !prescriptionUrl
                        ? '⚠️ Your cart contains prescription-required products. Please upload a valid prescription to proceed.'
                        : prescriptionUrl
                        ? '✓ Prescription uploaded successfully. You can upload a different one if needed.'
                        : 'If you\'re ordering prescription medicines, please upload your prescription'
                      }
                    </p>
                    
                    {!prescriptionUrl && (
                      <>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handlePrescriptionUpload}
                          disabled={uploadingPrescription}
                          className="w-full text-xs sm:text-sm text-gray-600 file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                        />
                        {uploadingPrescription && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span>Uploading prescription...</span>
                          </div>
                        )}
                      </>
                    )}
                    
                    {prescriptionUrl && (
                      <button
                        onClick={() => {
                          setPrescriptionUrl('');
                          setPrescriptionFile(null);
                        }}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Upload a different prescription
                      </button>
                    )}
                    {prescriptionFile && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-blue-300">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                {prescriptionFile.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(prescriptionFile.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setPrescriptionFile(null)}
                            className="ml-2 text-red-600 hover:text-red-800"
                            type="button"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Image Preview */}
                        {prescriptionFile.type.startsWith('image/') && (
                          <div className="mt-3">
                            <img 
                              src={URL.createObjectURL(prescriptionFile)} 
                              alt="Prescription preview" 
                              className="max-w-full h-auto rounded border max-h-48 object-contain"
                            />
                          </div>
                        )}
                        
                        {/* PDF Preview */}
                        {prescriptionFile.type === 'application/pdf' && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                            <span>PDF file ready to upload</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Order Notes */}
                  <div className="mt-4 sm:mt-6">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Order Notes (Optional)
                    </label>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      rows="3"
                      placeholder="Any special instructions for delivery..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Payment */}
              {activeStep === 4 && (
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">Payment Method</h2>
                  
                  <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                    <div className="border rounded-lg p-3 sm:p-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="payment"
                          value="phonepe"
                          checked={paymentMethod === 'phonepe'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mr-2 sm:mr-3"
                        />
                        <div className="flex items-center">
                          <img 
                            src="https://logoeps.com/wp-content/uploads/2013/03/phonepe-vector-logo.png" 
                            alt="PhonePe" 
                            className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3"
                          />
                          <div>
                            <h3 className="font-medium text-gray-800 text-sm sm:text-base">PhonePe</h3>
                            <p className="text-xs sm:text-sm text-gray-600">Pay securely with PhonePe</p>
                          </div>
                        </div>
                      </label>
                    </div>

                    <div className="border rounded-lg p-3 sm:p-4 opacity-50">
                      <label className="flex items-center cursor-not-allowed">
                        <input
                          type="radio"
                          name="payment"
                          value="cod"
                          disabled
                          className="mr-2 sm:mr-3"
                        />
                        <div>
                          <h3 className="font-medium text-gray-800 text-sm sm:text-base">Cash on Delivery</h3>
                          <p className="text-xs sm:text-sm text-gray-600">Pay when you receive (Coming Soon)</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="mb-4 sm:mb-6">
                    <label className="flex items-start sm:items-center">
                      <input
                        type="checkbox"
                        checked={agreeToTerms}
                        onChange={(e) => setAgreeToTerms(e.target.checked)}
                        className="mr-2 mt-1 sm:mt-0"
                      />
                      <span className="text-xs sm:text-sm text-gray-600">
                        I agree to the{' '}
                        <a href="/terms-and-conditions" className="text-green-600 hover:underline">
                          Terms and Conditions
                        </a>{' '}
                        and{' '}
                        <a href="/privacy-policy" className="text-green-600 hover:underline">
                          Privacy Policy
                        </a>
                      </span>
                    </label>
                  </div>

                  {paymentMethod === 'phonepe' && agreeToTerms && (
                    <div className="space-y-3">
                      {/* Test Payment Button */}
                      <TestPaymentButton
                        orderId={`ORDER_${Date.now()}`}
                        amount={getFinalTotal()}
                        userId={JSON.parse(localStorage.getItem('user') || '{}').id || `guest_${Date.now()}`}
                        mobileNumber={shippingAddress.phone}
                        shippingAddress={shippingAddress}
                        deliveryOption={deliveryOption}
                        orderNotes={orderNotes}
                        prescriptionUrl={prescriptionUrl}
                        cartItems={cartItems}
                        onPaymentInitiated={handlePaymentInitiated}
                        disabled={!agreeToTerms}
                        className="w-full"
                      />
                      
                      {/* Divider */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500">or</span>
                        </div>
                      </div>
                      
                      {/* Real PhonePe Payment Button (if configured) */}
                      <PaymentButton
                        orderId={`ORDER_${Date.now()}`}
                        amount={getFinalTotal()}
                        userId={shippingAddress.phone || `guest_${Date.now()}`}
                        mobileNumber={shippingAddress.phone}
                        onPaymentInitiated={handlePaymentInitiated}
                        disabled={!agreeToTerms}
                        className="w-full"
                      />
                      
                      <p className="text-xs text-gray-500 text-center">
                        💡 Use "Test Payment" for development/testing without real payment gateway
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                {activeStep > 1 && (
                  <button
                    onClick={prevStep}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Previous
                  </button>
                )}
                {activeStep < 4 && (
                  <button
                    onClick={nextStep}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 ml-auto"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-2">
            <div className="bg-white rounded-lg shadow-md p-6 lg:sticky lg:top-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h2>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal ({getTotalItems()} items)</span>
                  <span>₹{getSubtotal().toFixed(2)}</span>
                </div>
                
                {/* Show delivery option if selected (Step 3 or later) */}
                {activeStep >= 3 && (
                  <div className="flex justify-between">
                    <div className="flex flex-col">
                      <span>Delivery Charges</span>
                      <span className="text-xs text-gray-500">
                        {deliveryOption === 'standard' && '(Standard: 5-7 days)'}
                        {deliveryOption === 'express' && '(Express: 2-3 days)'}
                      </span>
                    </div>
                    <span className={getDeliveryCharge() === 0 ? 'text-green-600 font-medium' : ''}>
                      {getDeliveryCharge() === 0 ? 'Free' : `₹${getDeliveryCharge()}`}
                    </span>
                  </div>
                )}
                
                {cartItems.some(item => item.actual_price && Number(item.actual_price) > Number(item.price)) && (
                  <div className="flex justify-between text-green-600">
                    <span>Total Savings</span>
                    <span>
                      -₹{(
                        cartItems.reduce((sum, item) => 
                          sum + ((Number(item.actual_price) - Number(item.price)) * item.quantity || 0), 
                        0)
                      ).toFixed(2)}
                    </span>
                  </div>
                )}
                
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>₹{getFinalTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Address Preview */}
              {activeStep > 2 && shippingAddress.address && (
                <div className="mt-6 pt-4 border-t">
                  <h3 className="font-medium text-gray-800 mb-2">Delivery Address</h3>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">{shippingAddress.fullName}</p>
                    <p>{shippingAddress.address}</p>
                    <p>{shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}</p>
                    <p>{shippingAddress.phone}</p>
                  </div>
                </div>
              )}

              {/* Security Badge */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>Secure & encrypted payment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;