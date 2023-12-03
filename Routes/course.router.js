import { Router } from "express";
import {
  addLectureToCourseById,
  createCourse,
  getAllCourses,
  getAllLecturesByCourseId,
  removeCourse,
  removeLectureFromCourse,
  updateCourse,
} from "../Controllers/courses.controller.js";
import {
  authorizedRoles,
  authorizedSubscriber,
  isLoggedin,
} from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";
const router = Router();

router
  .route("/")
  .get(getAllCourses)
  .post(
    isLoggedin,
    authorizedRoles("ADMIN"),
    upload.single("thumbnail"),
    createCourse
  )
  .delete(isLoggedin, authorizedRoles("ADMIN"), removeLectureFromCourse);

router
  .route("/:id")
  .get(isLoggedin, authorizedSubscriber, getAllLecturesByCourseId)
  .put(isLoggedin, authorizedRoles("ADMIN"), updateCourse)
  .delete(isLoggedin, authorizedRoles("ADMIN"), removeCourse)
  .post(
    isLoggedin,
    authorizedRoles("ADMIN"),
    upload.single("lecture"),

    addLectureToCourseById
  );

export default router;

// // / Refactored code
// router
//   .route("/")
//   .get(getAllCourses)
//   .post(
//     isLoggedin,
//     authorizedRoles("ADMIN"),
//     upload.single("thumbnail"),
//     createCourse
//   )
//   .delete(isLoggedin, authorizedRoles("ADMIN"), removeLectureFromCourse);

// router
//   .route("/:id")
//   .get(isLoggedin, authorizedSubscriber, getAllLecturesByCourseId) // Added authorizeSubscribers to check if user is admin or subscribed if not then forbid the access to the lectures
//   .post(
//     isLoggedin,
//     authorizedRoles("ADMIN"),
//     upload.single("lecture"),
//     addLectureToCourseById
//   )
//   .put(isLoggedin, authorizedRoles("ADMIN"), updateCourse);

// export default router;
