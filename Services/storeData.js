const db = require("../config/db");

async function storeData(id, data) {
  try {
    const query = "INSERT INTO predictions (id, data) VALUES (?, ?)";
    await db.execute(query, [id, JSON.stringify(data)]);

    console.log("Data berhasil disimpan ke MySQL Cloud.");
  } catch (error) {
    console.error("Error saat menyimpan data ke MySQL Cloud:", error);
  }
}

module.exports = storeData;
