const express = require("express");
const router = express.Router();
const inferenceServices = require("../Services/inferenceServices");

// Route to handle skin disease detection
router.post("/detect", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    const result = await inferenceServices.detectSkinDisease(image);
    res.json({ success: true, result });
  } catch (error) {
    console.error("Error detecting skin disease:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

module.exports = router;
