const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ensure folders exist
["uploads/profile", "uploads/license"].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "profileImage") {
      cb(null, "uploads/profile/");
    } else if (file.fieldname === "license") {
      cb(null, "uploads/license/");
    } else {
      cb(new Error("Invalid field"), false);
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
 
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "profileImage") {
    return file.mimetype.startsWith("image/")
      ? cb(null, true)
      : cb(new Error("Profile photo must be an image"), false);
  }

  if (file.fieldname === "license") {
    return (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf"
    )
      ? cb(null, true)
      : cb(new Error("License must be image or PDF"), false);
  }

  cb(new Error("Unexpected field"), false);
};


const upload = multer({ storage, fileFilter });

module.exports = upload;
