const express = require("express");
const multer = require("multer");
const { Storage } = require("@google-cloud/storage");
const path = require("path");
const inferenceServices = require("../Services/inferenceServices");
const authMiddleware = require("../middlewares/authMiddleware");
const userService = require("../Services/userServices");

const router = express.Router();
const storage = new Storage();
const bucket = storage.bucket("ml-capstone-images"); // Ganti dengan nama bucket Anda

const multerStorage = multer.memoryStorage();
const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Batasi ukuran file menjadi 10MB
  },
  fileFilter: (req, file, cb) => {
    // Hanya izinkan file dengan tipe gambar
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPEG and PNG images are allowed"));
    }
    cb(null, true);
  },
}).single("image");

// Route to handle skin disease detection
router.post("/detect", authMiddleware.authMiddleware, (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      // Handle Multer-specific errors
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({ error: "Unexpected field" });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      // Handle other errors
      return res.status(500).json({ error: "Internal server error" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }

    try {
      const predictionId = Date.now().toString(); // Gunakan timestamp sebagai ID unik
      const fileExt = path.extname(req.file.originalname).toLowerCase(); // Dapatkan ekstensi file
      const fileName = `${predictionId}${fileExt}`; // Gunakan ekstensi file yang diunggah

      // Upload gambar ke Cloud Storage
      const file = bucket.file(fileName);
      const stream = file.createWriteStream({
        metadata: {
          contentType: req.file.mimetype,
        },
      });

      stream.on("error", (err) => {
        console.error("Error uploading image to Cloud Storage:", err);
        res.status(500).json({ success: false, error: "Internal server error" });
      });

      stream.on("finish", async () => {
        // Set Content-Type header to application/json
        res.setHeader("Content-Type", "application/json");

        // Get the public URL of the uploaded image
        const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        try {
          const result = await inferenceServices.detectSkinDisease(fileName, predictionId, req.user.id); // Mengirimkan hanya nama file, bukan URL lengkap
          res.json({ success: true, result });
        } catch (error) {
          console.error("Error detecting skin disease:", error.message);

          // Send a more specific error message if it's a client-side error
          if (error.message.includes("Image must have 3 channels") || error.message.includes("Error during image preprocessing")) {
            res.status(400).json({ success: false, error: error.message });
          } else {
            res.status(500).json({ success: false, error: "Internal server error" });
          }
        }
      });

      stream.end(req.file.buffer);
    } catch (error) {
      console.error("Error uploading image to Cloud Storage:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });
});

// Endpoint untuk mendapatkan informasi pengguna berdasarkan ID pengguna
router.get("/user/:userId", authMiddleware.authMiddleware, async (req, res) => {
  try {
    const userInfo = await userService.getUserInfo(req.params.userId);
    res.json({ success: true, user: userInfo });
  } catch (error) {
    console.error("Error fetching user information:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Endpoint untuk mengedit profil pengguna
router.put("/user/:userId", authMiddleware.authMiddleware, async (req, res) => {
  const userId = req.params.userId;
  const { email, username, birthdate, gender, phonenumber } = req.body;

  try {
    await userService.editUserProfile(userId, email, username, birthdate, gender, phonenumber);
    res.json({ success: true, message: "User profile updated successfully" });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

router.get("/history", authMiddleware.authMiddleware, async (req, res) => {
  try {
    // Panggil fungsi atau method yang akan mengambil riwayat deteksi penyakit kulit dari database berdasarkan ID pengguna
    const userHistory = await inferenceServices.getUserDetectionHistory(req.user.id);

    // Kirim riwayat deteksi sebagai respons
    res.json({ success: true, history: userHistory });
  } catch (error) {
    console.error("Error fetching user detection history:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

module.exports = router;
