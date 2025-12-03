import { useState, useEffect } from 'react';
import InfiniteDoctorList from '../components/InfiniteDoctorList';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


export default function DoctorPage({ city }) {
  const selectedCity = city || "Jaipur";
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDoctors = () => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/doctor`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch doctors');
        return res.json();
      })
      .then(data => {
        setDoctors(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const filtered = doctors
    .filter(doc => doc.city && doc.city.trim().toLowerCase() === selectedCity.trim().toLowerCase());

  return (
    <div className="min-h-screen container mx-auto px-4 py-6">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-8 text-green-700">
        Find Doctor's in {selectedCity}
      </h1>
      
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-lg text-gray-600">Loading doctors...</div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200 max-w-2xl mx-auto">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-red-800 mb-2">Unable to Load Doctors</h3>
          <p className="text-red-600 mb-4">
            We're having trouble connecting to our servers. Please try again later.
          </p>
          <p className="text-sm text-gray-600 mb-6">Error: {error}</p>
          <button
            onClick={fetchDoctors}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-200"
          >
            Try Again
          </button>
        </div>
      )}
      
      {!loading && !error && filtered.length === 0 && (
        <div className="flex items-center justify-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-5xl mb-4">👨‍⚕️</div>
            <h3 className="text-xl font-medium text-gray-600 mb-2">No Doctors Found in {selectedCity}</h3>
            <p className="text-gray-500 text-sm max-w-md mb-4">
              We're currently expanding our network of healthcare professionals in your area. Check back soon or try a different city.
            </p>
          </div>
        </div>
      )}
      
      {!loading && !error && filtered.length > 0 && (
        <InfiniteDoctorList doctors={filtered} onSelect={setSelectedDoc} />
      )}
    </div>
  );
}
