var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const connectDB = require("./config/db");
const cors = require("cors");
const searchRoutes = require("./routes/index");
var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var categoriesRouter = require("./routes/categories");
var productsRouter = require("./routes/products");
var orderssRouter = require("./routes/orders");
const paymentRouter = require("./routes/payment");
const multer = require("multer");
const mongoose = require("mongoose");
const discountsRouter = require("./routes/discounts");
const wishlistRouter = require("./routes/wishlist");
const commentsRouter = require("./routes/comments");
const tintucRouter = require("./routes/tintuc"); // Thêm route tin tức

const viewEngine = require("./config/viewEngine");
var app = express();
connectDB();

// Cấu hình multer
const upload = multer({ storage: multer.memoryStorage() });

// view engine setup
viewEngine(app);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

// Phục vụ file tĩnh từ thư mục public/images
app.use("/images", express.static(path.join(__dirname, "public/images")));
app.use("/uploads", express.static(path.join(__dirname, "public/images")));

// Áp dụng multer cho route users
app.use("/users", usersRouter);

app.use("/", searchRoutes);
app.use("/", indexRouter);
app.use("/categories", categoriesRouter);
app.use("/products", productsRouter);
app.use("/api/orders", orderssRouter);
app.use("/api/discounts", discountsRouter);
app.use("/wishlist", wishlistRouter);
app.use("/comments", commentsRouter);
app.use("/api/news", tintucRouter); // Thêm route tin tức
app.use("/payment", paymentRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

// Định nghĩa schema và model một lần
const messageSchema = new mongoose.Schema({
  from: String,
  to: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});
const Message = mongoose.model("Message", messageSchema);

// Export app và Message model để sử dụng trong bin/www
module.exports = { app, Message };