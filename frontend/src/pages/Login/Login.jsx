

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authUtils } from '../../utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);

  const otpRefs = useRef([]);

  const validateMobile = (mobile) => /^[6-9]\d{9}$/.test(mobile);

  const maskedMobile = `+91 XXXXXXX${mobile.slice(7)}`;

  // Timer countdown
  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const sendOtp = async () => {
    if (!validateMobile(mobile)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/send-otp`,
        { mobile: mobile.trim() }
      );

      if (response.data.success) {
        setOtpSent(true);
        setTimer(30); // 30-sec resend timer
        setOtp(['', '', '', '', '', '']); // clear OTP
        toast.success('OTP sent successfully!');
        setTimeout(() => otpRefs.current[0]?.focus(), 200);
      } else {
        setError(response.data.message || 'Failed to send OTP');
        toast.error(response.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to send OTP';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const joinedOtp = otp.join('');
    if (joinedOtp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/verify-otp`,
        {
          mobile: mobile.trim(),
          otp: joinedOtp,
        }
      );

      if (response.data.success) {
        const { isNewUser, user, token, data, expiresAt } = response.data;
        
        // Handle both old and new response formats
        const userData = user || data?.user;
        const authToken = token || data?.token;
        const tokenExpiry = expiresAt || data?.expiresAt;

        // Use name from server (will be 'User' for new users, or their actual name if updated)
        const userName = userData?.name || 'User';

        const userInfo = {
          id: userData?.id,
          name: userName,
          email: userData?.email || '',
          mobile: userData?.mobile || mobile,
        };

        // Save auth with expiry using auth utilities
        if (authToken && tokenExpiry) {
          authUtils.saveAuth(authToken, tokenExpiry, userInfo);
          console.log('🔐 Login successful - Token expires in', Math.round(authUtils.getTimeUntilExpiry() / 1000 / 60), 'minutes');
        } else {
          // Fallback to old method if no expiry
          localStorage.setItem('user', JSON.stringify(userInfo));
          if (authToken) {
            localStorage.setItem('authToken', authToken);
          }
        }

        toast.success(isNewUser ? 'Welcome! Please complete your profile.' : 'Login successful!');

        // Dispatch custom event to update navbar
        window.dispatchEvent(new Event('userLogin'));

        // Navigate based on user status
        if (isNewUser) {
          navigate('/profile'); // New users go to profile to set their name
        } else {
          navigate('/'); // Existing users go to home
        }

        // Call onLogin callback if provided
        if (onLogin) {
          onLogin(isNewUser ? 'user-profile' : 'home', userData?.id);
        }
      } else {
        const errorMsg = response.data.message || 'Invalid OTP';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Invalid OTP. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle 6-box OTP input
  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) otpRefs.current[index + 1].focus();
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  return (
    <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">
        Secure Login with OTP
      </h2>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* MOBILE INPUT */}
      <div className="mb-4">
        <label className="block text-md font-bold text-gray-700 mb-2">
          Mobile Number
        </label>
        <input
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="Enter 10-digit mobile number"
          value={mobile}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
            setMobile(value);
            setError('');
          }}
          maxLength={10}
          disabled={loading || otpSent}
        />
      </div>

      {/* SEND OTP BUTTON */}
      {!otpSent ? (
        <button
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors relative ${
            loading || !validateMobile(mobile)
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          onClick={sendOtp}
          disabled={loading || !validateMobile(mobile)}
        >
          {loading ? (
            <span className="loader"></span>
          ) : (
            'Send OTP'
          )}
        </button>
      ) : (
        <button
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            timer > 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          onClick={sendOtp}
          disabled={timer > 0 || loading}
        >
          {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
        </button>
      )}

      {/* OTP SENT MESSAGE */}
      {otpSent && (
        <p className="text-green-600 text-sm text-center mt-3">
          OTP sent to <strong>{maskedMobile}</strong>
        </p>
      )}

      {/* OTP INPUT (6 BOXES) */}
      <label className="block text-md font-bold text-gray-700 mt-2">
           Enter OTP
        </label>
      <div className="flex justify-between mt-2">
        
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (otpRefs.current[index] = el)}
            className={`w-10 h-12 text-center text-xl border rounded-lg 
              ${otpSent ? 'border-gray-400 focus:ring-2 focus:ring-green-500' : 'bg-gray-100 cursor-not-allowed'}
            `}
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(e.target.value, index)}
            onKeyDown={(e) => handleOtpKeyDown(e, index)}
            disabled={!otpSent || loading}
          />
        ))}
      </div>

      {/* VERIFY OTP BUTTON */}
      <button
        className={`w-full mt-5 py-2 px-4 rounded-md font-medium transition-colors relative ${
          !otpSent || otp.join('').length !== 6 || loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
        onClick={verifyOtp}
        disabled={!otpSent || otp.join('').length !== 6 || loading}
      >
        {loading ? (
          <span className="loader"></span>
        ) : (
          'Verify & Login'
        )}
      </button>

      {/* Spinner CSS */}
      <style>{`
        .loader {
          width: 18px;
          height: 18px;
          border: 3px solid #fff;
          border-bottom-color: transparent;
          border-radius: 50%;
          display: inline-block;
          animation: rotation 0.75s linear infinite;
        }
        @keyframes rotation {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
