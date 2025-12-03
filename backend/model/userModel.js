// Replace later with real DB model
const users = new Map(); // mobile → userObject

module.exports = {
  findUserByMobile(mobile) {
    return users.get(mobile) || null;
  },

  createUser(mobile) {
    const user = {
      id: Date.now().toString(),
      mobile
    };

    users.set(mobile, user);
    return user;
  }
};
