import coursemodel from "../model/courses.Schema.js";
import AppError from "../utils/error.util.js";
import cloudinary from "cloudinary";
import fs from "fs/promises";

const getAllCourses = async (req, res, next) => {
  try {
    const courses = await coursemodel.find({}).select("-lectures");
    res.status(200).json({
      success: true,
      message: "All courses here",
      courses,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

const getAllLecturesByCourseId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const courses = await coursemodel.findById(id);
    console.log("courses", courses);
    if (!courses) {
      return next(new AppError("Invalid course id", 400));
    }

    res.status(200).json({
      success: true,
      message: " courses lectured fetch successfully",
      lectures: courses.lectures,
    });
  } catch (error) {
    new AppError(error.message || "Courses not available on this id", 500);
  }
};

const createCourse = async (req, res, next) => {
  try {
    const { title, description, category, createdBy } = req.body;

    if (!title || !description || !category || !createdBy) {
      return next(new AppError("All field required", 500));
    }
    const course = await coursemodel.create({
      title,
      description,
      category,
      createdBy,
      thumbnail: {
        public_Id: "dummy",
        secure_Url: "dummy",
      },
    });

    // console.log(JSON.stringify(course));
    if (!course) {
      return next(new AppError("Course could not created", 500));
    }
    if (req.file) {
      try {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: "lms",
          crop: "fill",
        });
        // console.log(JSON.stringify(result));
        if (result) {
          course.thumbnail.public_Id = result.public_id;
          course.thumbnail.secure_Url = result.secure_url;
        }

        // delete
        fs.rm(`upload/${req.file.filename}`);
      } catch (e) {
        return next(new AppError(e.message, 500));
      }
    }

    await course.save();

    res.status(200).json({
      success: true,
      message: "Course Created Successfully ",
      course,
    });
  } catch (error) {
    return next(new AppError(error.message || "Not Created ! Try again", 500));
  }
};
const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await coursemodel.findByIdAndUpdate(
      id,
      {
        $set: req.body,
      },
      {
        runValidators: true,
      }
    );
    if (!course) {
      return next(
        new AppError(
          error.message || "Given Course by id doesn't exist ! Try again",
          500
        )
      );
    }
    res.status(200).json({
      success: true,
      message: "Course update Successfully",
      course,
    });
  } catch (error) {
    return next(new AppError(error.message || "Not Updated ! Try again", 500));
  }
};
const removeCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await coursemodel.findByIdAndDelete(id);

    if (!course) {
      return next(
        new AppError(
          error.message || "Given Course by id doesn't exist ! Try again",
          500
        )
      );
    }
    //  await coursemodel.findById();

    res.status(200).json({
      success: true,
      message: "Course delete Successfully",
    });
  } catch (error) {
    return next(
      new AppError(error.message || "Course doesn't removed ! Try again", 500)
    );
  }
};

const addLectureToCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!title || !description) {
      return next(
        new AppError(error.message || "All field required ! Try again", 500)
      );
    }

    const course = await coursemodel.findById(id);
    if (!course) {
      return next(
        new AppError(
          error.message || "Given Course by id doesn't exist ! Try again",
          500
        )
      );
    }
    const lectureData = {
      title,
      description,
      lecture: {},
    };

    if (req.file) {
      try {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: "lms",
          crop: "fill",
          chunk_size: 50000000, // 50 mb size
          resource_type: "video",
        });
        // console.log(JSON.stringify(result));
        if (result) {
          lectureData.lecture.public_Id = result.public_id;
          lectureData.lecture.secure_Url = result.secure_url;
        }

        // delete
        fs.rm(`upload/${req.file.filename}`);
      } catch (e) {
        // return next(new AppError(e.message, 500));
        return next(
          new AppError(
            JSON.stringify(error) || "File not uploaded, please try again",
            400
          )
        );
      }
    }

    course.lectures.push(lectureData);
    course.numberOfLecture = course.lectures.length;
    await course.save();

    res.status(200).json({
      success: true,
      message: "Lectures added successfully",
      course,
    });
  } catch (e) {
    return next(
      new AppError(
        e.message || "Course Lecture doesn't Created ! Try again",
        500
      )
    );
  }
};

const removeLectureFromCourse = async (req, res, next) => {
  // Grabbing the courseId and lectureId from req.query
  const { courseId, lectureId } = req.query;

  console.log(courseId);

  // Checking if both courseId and lectureId are present
  if (!courseId) {
    return next(new AppError("Course ID is required", 400));
  }

  if (!lectureId) {
    return next(new AppError("Lecture ID is required", 400));
  }

  // Find the course uding the courseId
  const course = await coursemodel.findById(courseId);

  // If no course send custom message
  if (!course) {
    return next(new AppError("Invalid ID or Course does not exist.", 404));
  }

  // Find the index of the lecture using the lectureId
  const lectureIndex = course.lectures.findIndex(
    (lecture) => lecture._id.toString() === lectureId.toString()
  );

  // If returned index is -1 then send error as mentioned below
  if (lectureIndex === -1) {
    return next(new AppError("Lecture does not exist.", 404));
  }

  // Delete the lecture from cloudinary
  await cloudinary.v2.uploader.destroy(
    course.lectures[lectureIndex].lecture.public_Id,
    {
      resource_type: "video",
    }
  );

  // Remove the lecture from the array
  course.lectures.splice(lectureIndex, 1);

  // update the number of lectures based on lectres array length
  course.numberOfLecture = course.lectures.length;

  // Save the course object
  await course.save();

  // Return response
  res.status(200).json({
    success: true,
    message: "Course lecture removed successfully",
  });
};

export {
  getAllCourses,
  getAllLecturesByCourseId,
  createCourse,
  updateCourse,
  removeCourse,
  addLectureToCourseById,
  removeLectureFromCourse,
};
