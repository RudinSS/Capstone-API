const db = require("../config/db");

async function getUserInfo(userId) {
  try {
    const [userInfo] = await db.execute("SELECT id, email, username, birthdate, gender, phonenumber FROM login WHERE id = ?", [userId]);

    if (userInfo.length === 0) {
      throw new Error("User not found");
    }

    return userInfo[0];
  } catch (error) {
    throw new Error(`Error fetching user information: ${error.message}`);
  }
}

async function editUserProfile(userId, email, username, birthdate, gender, phonenumber) {
  try {
    // Ambil informasi pengguna saat ini
    const [userInfo] = await db.execute("SELECT * FROM login WHERE id = ?", [userId]);

    if (userInfo.length === 0) {
      throw new Error("User not found");
    }

    const currentUser = userInfo[0];

    // Periksa apakah email baru sudah digunakan oleh pengguna lain
    if (email !== null && email !== currentUser.email) {
      const [existingEmail] = await db.execute("SELECT * FROM login WHERE email = ?", [email]);
      if (existingEmail.length > 0) {
        throw new Error("Email already exists");
      }
    }

    // Hanya perbarui kolom yang diberikan nilai baru (bukan null)
    const updatedEmail = email !== null ? email : currentUser.email;
    const updatedUsername = username !== null ? username : currentUser.username;
    const updatedBirthdate = birthdate !== null ? birthdate : currentUser.birthdate;
    const updatedGender = gender !== null ? gender : currentUser.gender;
    const updatedPhonenumber = phonenumber !== null ? phonenumber : currentUser.phonenumber;

    await db.execute("UPDATE login SET email = ?, username = ?, birthdate = ?, gender = ?, phonenumber = ? WHERE id = ?", [updatedEmail, updatedUsername, updatedBirthdate, updatedGender, updatedPhonenumber, userId]);

    return { userId, email: updatedEmail, username: updatedUsername, birthdate: updatedBirthdate, gender: updatedGender, phonenumber: updatedPhonenumber };
  } catch (error) {
    throw new Error(`Error updating user profile: ${error.message}`);
  }
}

module.exports = {
  getUserInfo,
  editUserProfile,
};
