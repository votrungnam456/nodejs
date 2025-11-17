import multer from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const jsonFileFilter = (req, file, cb) => {
  if (
    file.mimetype === "application/json" ||
    (file.originalname && file.originalname.endsWith(".json"))
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only JSON files are allowed!"), false);
  }
};

const uploadJson = multer({ storage, fileFilter: jsonFileFilter });

export { uploadJson };
