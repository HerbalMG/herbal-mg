import { useState, useEffect } from 'react';
import { createCustomer, updateCustomer } from '../lib/customerApi';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function CreateCustomerForm({ onClose, onCreated, customer }) {
  const isEditMode = !!customer;
  
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    houseNumber: "",
    area: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
  });
  
  // Populate form when editing
  useEffect(() => {
    const loadCustomerData = async () => {
      if (customer) {
        // Set basic customer info
        setForm(prev => ({
          ...prev,
          name: customer.name || "",
          email: customer.email || "",
          phone: customer.mobile || "",
        }));
        
        // Fetch customer's addresses
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(
            `${API_BASE}/customer/${customer.id}/addresses`,
            { headers: { 'Authorization': `Bearer ${token}` }}
          );
          
          const addresses = response.data.data || response.data || [];
          if (addresses.length > 0) {
            // Use the first (or default) address
            const addr = addresses.find(a => a.is_default) || addresses[0];
            
            // Parse address_line1: "house_number, area, landmark"
            const addressParts = (addr.address_line1 || '').split(',').map(part => part.trim());
            
            setForm(prev => ({
              ...prev,
              houseNumber: addressParts[0] || "",
              area: addressParts[1] || "",
              landmark: addressParts[2] || "",
              city: addr.city || "",
              state: addr.state || "",
              pincode: addr.pincode || "",
              country: addr.country || "India",
            }));
          }
        } catch (err) {
          console.error('Failed to load customer addresses:', err);
          // If address fetch fails, try parsing from customer.address field (legacy)
          if (customer.address) {
            const addressParts = customer.address.split(',').map(part => part.trim());
            setForm(prev => ({
              ...prev,
              houseNumber: addressParts[0] || "",
              area: addressParts[1] || "",
              landmark: addressParts[2] || "",
              city: addressParts[3] || "",
              state: addressParts[4] || "",
              pincode: addressParts[5] || "",
              country: addressParts[6] || "India",
            }));
          }
        }
      }
    };
    
    loadCustomerData();
  }, [customer]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const customerData = {
        name: form.name,
        email: form.email,
        mobile: form.phone,
        active: true,
      };

      let result;
      if (isEditMode) {
        result = await updateCustomer(customer.id, customerData);
      } else {
        result = await createCustomer(customerData);
      }
      
      // Create or update address record using the address API (same as frontend)
      if (form.houseNumber || form.area || form.city) {
        try {
          const token = localStorage.getItem('token');
          const addressPayload = {
            full_name: form.name,
            email: form.email,
            contact: form.phone,
            address_line1: `${form.houseNumber}, ${form.area}, ${form.landmark}`.replace(/^,\s*|,\s*$/g, ''), // Remove leading/trailing commas
            address_line2: '',
            city: form.city,
            state: form.state,
            pincode: form.pincode,
            country: form.country || 'India',
            is_default: true
          };
          
          if (isEditMode) {
            // Try to update existing address or create new one
            try {
              const addressesResponse = await axios.get(
                `${API_BASE}/customer/${result.id}/addresses`,
                { headers: { 'Authorization': `Bearer ${token}` }}
              );
              
              const addresses = addressesResponse.data.data || addressesResponse.data || [];
              if (addresses.length > 0) {
                // Update first address
                await axios.put(
                  `${API_BASE}/customer/${result.id}/addresses/${addresses[0].id}`,
                  addressPayload,
                  { headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }}
                );
                console.log('✅ Address updated for customer:', result.id);
              } else {
                // Create new address
                await axios.post(
                  `${API_BASE}/customer/${result.id}/addresses`,
                  addressPayload,
                  { headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }}
                );
                console.log('✅ Address created for customer:', result.id);
              }
            } catch (updateErr) {
              console.error('Failed to update address, creating new:', updateErr);
              // If update fails, try creating
              await axios.post(
                `${API_BASE}/customer/${result.id}/addresses`,
                addressPayload,
                { headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }}
              );
            }
          } else {
            // Create new address for new customer
            await axios.post(
              `${API_BASE}/customer/${result.id}/addresses`,
              addressPayload,
              { headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }}
            );
            console.log('✅ Address created for customer:', result.id);
          }
        } catch (addressErr) {
          console.error('Failed to save address:', addressErr);
          // Don't fail the whole operation if address creation fails
        }
      }
      
      onCreated(result);
      onClose();
    } catch (err) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} customer:`, err);
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} customer. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded p-6 w-full max-w-xl max-h-screen overflow-y-auto relative">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-xl font-semibold mb-4">{isEditMode ? 'Edit Customer' : 'Add New Customer'}</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <input name="name" value={form.name} onChange={handleChange} placeholder="Full Name" required className="border p-2 rounded col-span-2" />
          <input name="email" value={form.email} onChange={handleChange} placeholder="Email" type="email" required className="border p-2 rounded col-span-2" />
          <div className="flex">
          <span className="inline-flex items-center px-3 border border-r-0 rounded-l bg-gray-100 text-gray-600">
      +91
    </span>
          <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone Number" required className="w-full border p-2 rounded col-span-2" />
          </div>

          <input name="houseNumber" value={form.houseNumber} onChange={handleChange} placeholder="House Number" required className="border p-2 rounded" />
          <input name="area" value={form.area} onChange={handleChange} placeholder="Area" required className="border p-2 rounded " />
          <input name="landmark" value={form.landmark} onChange={handleChange} placeholder="Landmark" className="border p-2 rounded " />
          <input name="city" value={form.city} onChange={handleChange} placeholder="City" required className="border p-2 rounded" />
          <input name="state" value={form.state} onChange={handleChange} placeholder="State" required className="border p-2 rounded" />
          <input name="pincode" value={form.pincode} onChange={handleChange} placeholder="Pincode" required className="border p-2 rounded" />
          <input name="country" value={form.country} onChange={handleChange} placeholder="Country" required className="border p-2 rounded" />
          <div className="col-span-2 text-right mt-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`px-4 py-2 rounded ${
                isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              } text-white`}
            >
              {isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
