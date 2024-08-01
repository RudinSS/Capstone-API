const express = require("express");
const app = express();
const authRoutes = require("./routes/auth");
const db = require("./config/db");
const authMiddleware = require("./middlewares/authMiddleware");
const routes = require("./routes/handler");

app.use(express.json());
app.use(authRoutes);
app.use(routes);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  db.execute("SELECT 1")
    .then(() => {
      console.log("Database connection successful");
    })
    .catch((err) => {
      console.error("Database connection failed:", err);
    });
});

(async () => {
  const loadModel = require("./Services/loadModel"); // Adjust the path as necessary
  try {
    const model = await loadModel();
    console.log("Model loaded successfully");

    // Example of using the model for inference
    // const input = tf.tensor([...]);
    // const prediction = model.predict(input);
    // console.log(prediction);
  } catch (err) {
    console.error("Failed to load model:", err);
  }
})();
