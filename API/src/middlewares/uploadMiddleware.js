const multer = require("multer");
const path = require("path");

// ✅ Tạo middleware upload linh hoạt với thư mục động
const upload = (folder) => {
  // Đường dẫn thư mục lưu ảnh upload
  const uploadDir = path.join(__dirname, "../public/images", folder);

  // Cấu hình nơi lưu và tên file
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Thêm timestamp để tránh trùng tên file
      cb(null, Date.now() + '-' + file.originalname);
    },
  });

  // Kiểm tra định dạng file ảnh
  const checkImage = (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Vui lòng chọn đúng định dạng ảnh (jpg, png, ...)"), false);
    }
    cb(null, true);
  };

  return multer({
    storage: storage,
    fileFilter: checkImage,
    limits: {
      fileSize: 5 * 1024 * 1024 // giới hạn file: 5MB
    }
  });
};

module.exports = upload;