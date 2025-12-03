const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto");

const { findUserByMobile, createUser } = require("../model/userModel");
const { generateToken } = require("../utils/jwt");
const rateLimiter = require("../utils/rateLimiter");

// 2Factor API Key
const TWO_FACTOR_API_KEY = process.env.TWO_FACTOR_API_KEY;

// Stores session_id per mobile
const otpStore = new Map();

/* ---------------------------------------------
   SEND OTP (No username required)
---------------------------------------------- */
router.post("/send-otp", async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({ success: false, message: "Mobile required" });
    }

    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({ success: false, message: "Invalid mobile format" });
    }

    // RATE LIMITING
    if (!rateLimiter.otpAllowed(mobile)) {
      return res.status(429).json({
        success: false,
        message: "Daily OTP limit reached. Try again tomorrow."
      });
    }

    // SEND VIA 2FACTOR
const url = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/${mobile}/AUTOGEN/OTP`;

    const response = await axios.get(url);

    if (response.data.Status !== "Success") {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP",
        details: response.data.Details
      });
    }

    // SAVE session_id
    otpStore.set(mobile, {
      session_id: response.data.Details,
      attempts: 0
    });

    return res.json({
      success: true,
      message: "OTP sent successfully"
    });

  } catch (error) {
    console.error("Send OTP Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------------------------------------------
   VERIFY OTP → Auto Create User + JWT
---------------------------------------------- */
router.post("/verify-otp", async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({ success: false, message: "Mobile & OTP required" });
    }

    const saved = otpStore.get(mobile);
    if (!saved) {
      return res.status(400).json({ success: false, message: "OTP expired. Request again." });
    }

    // Check attempts
    if (saved.attempts >= 3) {
      otpStore.delete(mobile);
      return res.status(400).json({ success: false, message: "Too many attempts. Try again." });
    }

    saved.attempts++;

    // Verify using 2Factor
    const url = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/VERIFY/${saved.session_id}/${otp}`;
    const result = await axios.get(url);

    if (result.data.Status !== "Success") {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
        attemptsRemaining: 3 - saved.attempts
      });
    }

    // OTP MATCHED
    otpStore.delete(mobile);

    // AUTO CREATE USER IF NOT EXISTS
    let user = findUserByMobile(mobile);
    const isNewUser = !user;

    if (!user) {
      user = createUser(mobile);
    }

    // GENERATE JWT
    const token = generateToken(user);

    return res.json({
      success: true,
      message: "OTP verified",
      isNewUser,
      token,
      user
    });

  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------------------------------------------
   RESEND OTP
---------------------------------------------- */
router.post("/resend-otp", async (req, res) => {
  try {
    const { mobile } = req.body;

    const saved = otpStore.get(mobile);
    if (!saved) {
      return res.status(400).json({
        success: false,
        message: "No active session."
      });
    }

    // 2Factor resend API
    const url = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/RESEND/${saved.session_id}`;
    const response = await axios.get(url);

    if (response.data.Status !== "Success") {
      return res.status(500).json({
        success: false,
        message: "Failed to resend OTP"
      });
    }

    return res.json({
      success: true,
      message: "OTP resent successfully"
    });

  } catch (error) {
    console.error("Resend OTP Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
