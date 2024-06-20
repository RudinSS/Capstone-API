const db = require("../config/db");

async function storeData(id, data) {
  try {
    const query = `
      INSERT INTO predictions (prediction_id, predicted_class, predicted_disease, confidence_score, description, prevention, treatment)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        predicted_class = VALUES(predicted_class),
        predicted_disease = VALUES(predicted_disease),
        confidence_score = VALUES(confidence_score),
        description = VALUES(description),
        prevention = VALUES(prevention),
        treatment = VALUES(treatment);
    `;
    await db.execute(query, [id, data.predictedClass, data.predictedDisease, data.confidenceScore, data.description, data.prevention, data.treatment]);

    console.log("Data berhasil disimpan ke MySQL Cloud.");
  } catch (error) {
    console.error("Error saat menyimpan data ke MySQL Cloud:", error);
  }
}

module.exports = storeData;
