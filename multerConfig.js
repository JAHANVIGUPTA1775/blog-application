const multer= require("multer");
const { storage } = require('./cloudinary'); 
const path=require("path");


// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, "uploads/");
//     },
//     filename: (req, file, cb) => {
//       const ext = path.extname(file.originalname);
//       cb(null, Date.now() + ext); // Add a timestamp to avoid filename conflicts
//     },
//   });
const upload = multer({ storage: storage });

module.exports = upload;


