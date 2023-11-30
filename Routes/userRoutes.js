import { Router } from "express";
import {
  register,
  login,
  logout,
  getProfile,
  forgotPassword,
  resetPassword,
  changePassword,
  updateUser,
  adminRegister,
} from "../Controllers/user.controllerr.js";
import { isLoggedin } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";

const router = Router();

router.post("/register", upload.single("avatar"), register);
router.post("/login", login);
router.get("/logout", isLoggedin, logout);
router.get("/me", isLoggedin, getProfile);
router.post("/reset", forgotPassword);
router.post("/reset/:resetToken", resetPassword);
router.post("/change-password", isLoggedin, changePassword);
router.put("/update/:id", isLoggedin, upload.single("avatar"), updateUser);

export default router;
