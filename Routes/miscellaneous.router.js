import { Router } from "express";
import {
  contactUs,
  userStats,
} from "../Controllers/miscellaneous.controller.js";
import { authorizedRoles, isLoggedin } from "../middleware/auth.middleware";

const router = Router();

router.route("/contact").post(contactUs);
router
  .route("admin/stats/users")
  .get(isLoggedin, authorizedRoles("ADMIN"), userStats);

export default router;
