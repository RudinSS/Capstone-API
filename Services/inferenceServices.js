const tf = require("@tensorflow/tfjs-node");
const { Storage } = require("@google-cloud/storage");
const loadModel = require("./loadModel");
const storeData = require("./storeData");
const storeHistory = require("./storeHistory");
const db = require("../config/db");

// Load the model once when the module is imported
const modelPromise = loadModel();

// Array of skin diseases corresponding to predictedClass index
const skinDiseases = [
  "Acne and Rosacea",
  "Actinic Keratosis Basal Cell Carcinoma and other Malignant Lesions",
  "Atopic Dermatitis",
  "Bullous Disease",
  "Cellulitis Impetigo and other Bacterial Infections",
  "Eczema",
  "Exanthems and Drug Eruptions",
  "Hair Loss Photos Alopecia and other Hair Diseases",
  "Herpes HPV and other STDs",
  "Light Diseases and Disorders of Pigmentation",
  "Lupus and other Connective Tissue Diseases",
  "Melanoma Skin Cancer Nevi and Moles",
  "Nail Fungus and other Nail Disease",
  "Poison Ivy Photos and other Contact Dermatitis",
  "Psoriasis pictures Lichen Planus and Related Diseases",
  "Scabies Lyme Disease and other Infestations and Bites",
  "Seborrheic Keratoses and other Benign Tumors",
  "Systemic Disease",
  "Tinea Ringworm Candidiasis and other Fungal Infections",
  "Urticaria Hives",
  "Vascular Tumors",
  "Vasculitis Photos",
  "Warts Molluscum and other Viral Infections",
  "No Detected Disease",
];

// Detailed information about each skin disease
const skinDiseaseInfo = {
  "Acne and Rosacea": {
    description: "Acne and Rosacea are common skin conditions characterized by pimples, redness, and swelling.",
    prevention: "Maintain a regular skin cleansing routine, avoid oily skin products.",
    treatment: "Topical creams, antibiotics, and laser treatments.",
  },
  "Actinic Keratosis Basal Cell Carcinoma and other Malignant Lesions": {
    description: "Actinic keratosis and basal cell carcinoma are types of skin cancer caused by sun exposure.",
    prevention: "Use sunscreen, wear protective clothing, avoid peak sun hours.",
    treatment: "Cryotherapy, topical treatments, surgical removal.",
  },
  "Atopic Dermatitis": {
    description: "Atopic Dermatitis is a chronic skin condition that causes itchy and inflamed skin.",
    prevention: "Keep skin moisturized, avoid triggers like harsh soaps and certain fabrics.",
    treatment: "Topical steroids, moisturizers, and avoiding allergens.",
  },
  "Bullous Disease": {
    description: "Bullous diseases are a group of skin disorders characterized by large blisters.",
    prevention: "Avoid trauma to the skin, manage any underlying conditions.",
    treatment: "Corticosteroids, immunosuppressants, and proper wound care.",
  },
  "Cellulitis Impetigo and other Bacterial Infections": {
    description: "Bacterial infections like Cellulitis and Impetigo cause redness, swelling, and pus-filled sores.",
    prevention: "Keep skin clean and properly treated for wounds.",
    treatment: "Antibiotics and proper wound care.",
  },
  Eczema: {
    description: "Eczema is a condition that makes your skin red and itchy. It’s common in children but can occur at any age.",
    prevention: "Avoid triggers such as certain soaps, fabrics, and stress.",
    treatment: "Topical treatments, moisturizers, and avoiding irritants.",
  },
  "Exanthems and Drug Eruptions": {
    description: "Exanthems are widespread rashes usually caused by infections, while drug eruptions are caused by medication reactions.",
    prevention: "Avoid known allergens and drugs that cause reactions.",
    treatment: "Antihistamines, corticosteroids, and discontinuing the offending drug.",
  },
  "Hair Loss Photos Alopecia and other Hair Diseases": {
    description: "Hair diseases include conditions like Alopecia which cause hair loss and thinning.",
    prevention: "Maintain a healthy diet and avoid harsh hair treatments.",
    treatment: "Medications, hair growth treatments, and sometimes surgical options.",
  },
  "Herpes HPV and other STDs": {
    description: "Sexually transmitted diseases such as Herpes and HPV cause various skin lesions and other symptoms.",
    prevention: "Practice safe sex, get vaccinated for HPV.",
    treatment: "Antiviral medications and topical treatments.",
  },
  "Light Diseases and Disorders of Pigmentation": {
    description: "Conditions like vitiligo and melasma affect skin pigmentation causing light or dark patches.",
    prevention: "Protect skin from excessive sun exposure.",
    treatment: "Topical treatments, light therapy, and cosmetic procedures.",
  },
  "Lupus and other Connective Tissue Diseases": {
    description: "Lupus is an autoimmune disease that affects the skin and other organs.",
    prevention: "Avoid sun exposure and manage stress.",
    treatment: "Immunosuppressants, corticosteroids, and lifestyle changes.",
  },
  "Melanoma Skin Cancer Nevi and Moles": {
    description: "Melanoma is a dangerous form of skin cancer that can develop from moles.",
    prevention: "Regular skin checks and avoiding excessive sun exposure.",
    treatment: "Surgical removal, chemotherapy, and radiation therapy.",
  },
  "Nail Fungus and other Nail Disease": {
    description: "Nail diseases like fungal infections cause discoloration, thickening, and separation of the nail from the nail bed.",
    prevention: "Keep nails clean and dry, avoid sharing nail tools.",
    treatment: "Antifungal treatments and proper nail care.",
  },
  "Poison Ivy Photos and other Contact Dermatitis": {
    description: "Contact dermatitis is an inflammatory reaction of the skin to allergens or irritants like poison ivy.",
    prevention: "Avoid contact with known allergens or irritants.",
    treatment: "Topical steroids and antihistamines.",
  },
  "Psoriasis pictures Lichen Planus and Related Diseases": {
    description: "Psoriasis and Lichen Planus are chronic conditions that cause scaly, itchy patches on the skin.",
    prevention: "Avoid triggers like stress and skin injury.",
    treatment: "Topical treatments, light therapy, and medications.",
  },
  "Scabies Lyme Disease and other Infestations and Bites": {
    description: "Infestations like scabies and Lyme disease cause severe itching and skin irritation.",
    prevention: "Avoid contact with infected individuals and use insect repellent.",
    treatment: "Medications to eliminate infestations and manage symptoms.",
  },
  "Seborrheic Keratoses and other Benign Tumors": {
    description: "Seborrheic keratoses are benign skin growths that can appear as warty lesions.",
    prevention: "There is no known prevention, but regular skin checks are advised.",
    treatment: "Cryotherapy or surgical removal for cosmetic reasons.",
  },
  "Systemic Disease": {
    description: "Systemic diseases can affect the skin and other organs, leading to a variety of skin manifestations.",
    prevention: "Regular medical check-ups and managing underlying conditions.",
    treatment: "Depends on the underlying disease; may include medications and lifestyle changes.",
  },
  "Tinea Ringworm Candidiasis and other Fungal Infections": {
    description: "Fungal infections like ringworm and candidiasis cause red, itchy, and scaly patches on the skin.",
    prevention: "Keep skin clean and dry, avoid sharing personal items.",
    treatment: "Antifungal creams, oral medications, and maintaining good hygiene.",
  },
  "Urticaria Hives": {
    description: "Urticaria, or hives, are red, itchy welts that result from an allergic reaction.",
    prevention: "Avoid known allergens and stress.",
    treatment: "Antihistamines and avoiding triggers.",
  },
  "Vascular Tumors": {
    description: "Vascular tumors are growths made up of blood vessels and can be benign or malignant.",
    prevention: "Regular skin checks and monitoring for changes.",
    treatment: "Depends on the type; may include surgery, laser treatment, or observation.",
  },
  "Vasculitis Photos": {
    description: "Vasculitis involves inflammation of blood vessels, which can affect the skin and other organs.",
    prevention: "Manage underlying conditions and avoid triggers.",
    treatment: "Immunosuppressants and corticosteroids.",
  },
  "Warts Molluscum and other Viral Infections": {
    description: "Viral infections like warts and molluscum contagiosum cause skin lesions.",
    prevention: "Avoid direct contact with infected individuals and practice good hygiene.",
    treatment: "Topical treatments, cryotherapy, and sometimes surgical removal.",
  },
};

// Function to preprocess the image
const preprocessImage = async (fileUrl) => {
  try {
    const storage = new Storage();
    const bucket = storage.bucket("ml-capstone-images"); // Ganti dengan nama bucket Anda

    const file = bucket.file(fileUrl);
    const fileBuffer = await file.download();
    const imageTensor = tf.node.decodeImage(fileBuffer[0]);

    // Check if image has 3 channels (RGB)
    if (imageTensor.shape[2] !== 3) {
      throw new Error("Image must have 3 channels (RGB)");
    }

    const resizedImage = tf.image.resizeBilinear(imageTensor, [180, 180]);
    const normalizedImage = resizedImage.div(255.0).expandDims(0);
    return normalizedImage;
  } catch (error) {
    throw new Error(`Error during image preprocessing: ${error.message}`);
  }
};

// Function to make predictions and store them in the database
const detectSkinDisease = async (fileUrl, predictionId, userId) => {
  try {
    const model = await modelPromise; // Ensure the model is loaded
    const processedImage = await preprocessImage(fileUrl);
    const prediction = model.predict(processedImage);
    const scores = await prediction.data();

    // Get the index of the class with the highest score
    const predictedClass = tf.argMax(prediction, -1).dataSync()[0];

    // Calculate confidence score based on the maximum score
    const confidenceScore = Math.max(...scores) * 100;

    let predictedDisease;

    // Check if confidence score is below 30% and set the disease to "Normal and Healthy" if true
    if (confidenceScore < 30) {
      predictedDisease = "No Detected Disease";
    } else {
      predictedDisease = skinDiseases[predictedClass];
    }

    const imageUrl = `https://storage.googleapis.com/ml-capstone-images/${fileUrl}`;

    // Fetch detailed information for the predicted disease
    const diseaseInfo = skinDiseaseInfo[predictedDisease] || {
      description: "Your skin is Healthy",
      prevention: "-",
      treatment: "-",
    };

    const result = {
      predictedClass,
      predictedDisease,
      confidenceScore,
      ...diseaseInfo,
    };

    // Store the prediction and confidence score in the database
    await storeData(predictionId, result);

    // Store the detection history for the logged-in user
    await storeHistory(userId, { ...result, predictionId, imageUrl });

    return result;
  } catch (error) {
    console.error("Error during prediction or storing data:", error);
    throw new Error(`Prediction or storage error: ${error.message}`);
  }
};

async function getUserDetectionHistory(userId) {
  try {
    // Panggil method atau fungsi yang akan mengambil riwayat deteksi penyakit kulit dari database berdasarkan ID pengguna
    const userHistory = await db.query("SELECT * FROM detection_history WHERE user_id = ?", [userId]);

    return userHistory;
  } catch (error) {
    throw new Error(`Error fetching user detection history: ${error.message}`);
  }
}

module.exports = {
  detectSkinDisease,
  getUserDetectionHistory,
};
