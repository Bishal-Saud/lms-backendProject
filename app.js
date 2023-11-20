import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import userRoutes from "./Routes/userRoutes.js";
import dbConnect from "./config/dbConnection.js";
import errorMiddleware from "./middleware/error.middleware.js";
import courseRoutes from "./Routes/course.router.js";
import paymentRoutes from "./Routes/payment.route.js";

const app = express();
app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/admin", userRoutes);

app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use(morgan("dev"));
dbConnect();

app.use("/ping", (req, res) => {
  res.send("PONG");
});

app.all("*", (req, res) => {
  res.status(400).send("OOPS ! 404 Page not found !!");
});

app.use(errorMiddleware);
export default app;
