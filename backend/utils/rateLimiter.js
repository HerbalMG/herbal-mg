const otpLimitStore = new Map(); // mobile → { count, date }

const MAX_OTP_PER_DAY = 5;

module.exports = {
  otpAllowed(mobile) {
    const today = new Date().toISOString().slice(0, 10);
    const record = otpLimitStore.get(mobile);

    if (!record) {
      otpLimitStore.set(mobile, { count: 1, date: today });
      return true;
    }

    if (record.date !== today) {
      otpLimitStore.set(mobile, { count: 1, date: today });
      return true;
    }

    if (record.count >= MAX_OTP_PER_DAY) return false;

    record.count++;
    return true;
  }
};
