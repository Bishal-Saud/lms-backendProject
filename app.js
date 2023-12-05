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

const app = express();
app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    credentials: true,
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

// Serve the React app for all routes
const publicPath = path.join(__dirname, "..", "client", "lms-frontend");
app.use(express.static(publicPath));

// Catch-all route for React app
app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

app.use(errorMiddleware);
export default app;
