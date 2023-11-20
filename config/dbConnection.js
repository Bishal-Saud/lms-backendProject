import mongoose from "mongoose";
import { config } from "dotenv";
config();
mongoose.set("strictQuery", false);
const MONGO_URL = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
// console.log('MONGO_URL,',process.env.MONGO_URI);

const dbConnect = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("Database connected successfully");
  } catch (error) {
    console.log("Database Error: ", error);
  }
};

export default dbConnect;
