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
    origin: "*",
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
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

app.get("*", (req, res) => {
  res.send("OOPS ! Page Not Found");
});

app.use(errorMiddleware);
export default app;
