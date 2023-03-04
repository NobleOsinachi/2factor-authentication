const cloudinary = require("cloudinary").v2;

const multer = require("multer");
const path = require("path");

//multer config

const upload = multer({
  storage: multer.diskStorage({}),
  limits: {
    fileSize: 1000000, // 1MB in bytes
  },
  fileFilter: (req, file, cb) => {
    let ext = path.extname(file.originalname);
    if (ext != ".jpg" && ext !== ".jpeg" && ext !== ".png") {
      cb(new Error("File type is not supported"), false);
      return;
    }
    cb(null, true);
  },
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = { upload, cloudinary };
