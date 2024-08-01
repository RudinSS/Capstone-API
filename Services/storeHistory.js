const db = require("../config/db");

async function storeHistory(userId, data) {
  try {
    const query = `
      INSERT INTO detection_history (user_id, prediction_id, predicted_class, predicted_disease, confidence_score, image_url, description, prevention, treatment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db.execute(query, [userId, data.predictionId, data.predictedClass, data.predictedDisease, data.confidenceScore, data.imageUrl, data.description, data.prevention, data.treatment]);

    console.log("History berhasil disimpan ke MySQL Cloud.");
  } catch (error) {
    console.error("Error saat menyimpan history ke MySQL Cloud:", error);
  }
}

module.exports = storeHistory;
