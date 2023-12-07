import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import userRoutes from "./Routes/userRoutes.js";
import dbConnect from "./config/dbConnection.js";
import errorMiddleware from "./middleware/error.middleware.js";
import courseRoutes from "./Routes/course.router.js";
import paymentRoutes from "./Routes/payment.route.js";
import contactRoutes from "./Routes/miscellaneous.router.js";
// import path from "path";
const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: false,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/", contactRoutes);

dbConnect();

app.use("/ping", (req, res) => {
  res.send("PONG");
});
app.use((req, res, next) => {
  console.log("CORS middleware hit.");
  console.log("Incoming request:", req.method, req.url);
  console.log("Headers:", req.headers);
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
  res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

app.options("*", cors());

// Catch-all route for React app
app.get("*", (req, res) => {
  // res.sendFile(path.join(publicPath, "index.html"));
  res.send("OOPS ! Page Not Found");
});

app.use(errorMiddleware);
export default app;
