import User from "../model/user.schema.js";
import AppError from "../utils/error.util.js";
import cloudinary from "cloudinary";
import fs from "fs/promises";
import sendEmail from "../utils/node.mailer.js";
import crypto from "crypto";

const cookieOptions = {
  maxAge: 7 * 24 * 60 * 60 * 1000, //7days
  httpOnly: true,
  secure: true,
};

//  Admin Registration
export const adminRegister = async (req, res) => {
  const { fullName, email, password, role } = req.body;

  try {
    // Create a new admin user with the specified role
    const admin = new User({ fullName, email, password, role });

    if (role) {
      console.log("role", role);
    }

    // Save the admin user to the database
    await admin.save();

    // Respond with success message or created user details
    res
      .status(201)
      .json({ message: "Admin registered successfully", user: admin });
  } catch (error) {
    // Handle errors during the registration process
    res
      .status(500)
      .json({ message: "Failed to register admin", error: error.message });
  }
};

const register = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return new next(new AppError("All fields are required", 400));
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
      return new next(new AppError("User already exists", 400));
    }

    const user = await User.create({
      fullName,
      email,
      password,
      avatar: {
        public_id: email,
        secure_url:
          "https://res.cloudinary.com/dkmecsxuo/image/upload/v1691751510/lms/cflateodnkq0qspxgzxn.jpg",
      },
      // role,
    });

    if (!user) {
      return new next(new AppError("User registration failed", 400));
    }

    //ToDo: file upload
    // console.log(req.file);
    if (req.file) {
      try {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: "lms",
          width: 250,
          height: 250,
          gravity: "faces",
          crop: "fill",
        });

        if (result) {
          user.avatar.public_id = result.public_id;
          user.avatar.secure_url = result.secure_url;

          //remove file from server
          await fs.rm(`upload/${req.file.filename}`);
        }
      } catch (error) {
        return next(
          new AppError(error || "File not uploaded please try again", 500)
        );
      }
    }

    await user.save();
    user.password = undefined;

    const token = await user.generateJWTtoken();
    res.cookie("token", token, cookieOptions);
    res.status(200).json({
      success: true,
      message: "User register Successfully",
      user,
    });
  } catch (error) {
    return new next(new AppError(`Something wrong ${error.message}`, 400));
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return new next(new AppError("ALL field required", 400));
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.comparePassword(password)) {
      return new next(new AppError("Email or Password doesn't match", 400));
    }
    const token = await user.generateJWTtoken();
    user.password = undefined;
    res.cookie("token", token, cookieOptions);
    res.status(200).json({
      success: true,
      message: "User login Successfully",
      user,
    });
  } catch (error) {
    return new next(new AppError(`Something wrong ${error.message}`, 400));
  }
};

const logout = (req, res, next) => {
  res.cookie("token", null, {
    secure: true,
    httpOnly: true,
    maxAge: 0,
  });

  res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
};

const getProfile = async (req, res, next) => {
  try {
    const userID = req.user.id;
    const user = await User.findById(userID);

    res.status(200).json({
      success: true,
      message: "User details",
    });
  } catch (error) {
    return next(new AppError("Failed to fetch profile/user details ", 500));
  }
};

const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new AppError("Email is required", 400));
  }
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("Email is not registered ", 500));
  }
  const resetToken = await user.generateResetPasswordToken();
  await user.save();

  const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  // console.log(resetPasswordUrl);
  const subject = "Reset password";
  const message = `You can reset your password by clicking <a href=${resetPasswordUrl} target="_blank">Reset your password</a>\nIf the above link does not work for some reason then copy paste this link in new tab ${resetPasswordUrl}.\n If you have not requested this, kindly ignore.`;

  try {
    await sendEmail(email, subject, message);
    res.status(200).json({
      success: true,
      message: `Reset password token has been sent to the ${email} successfully`,
    });
  } catch (error) {
    user.forgotPasswordExpiry = undefined;
    user.forgotPasswordToken = undefined;
    await user.save();
    return next(new AppError(error.message, 500));
  }
};

const resetPassword = async (req, res, next) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  const forgotPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const user = User.findOne({
    forgotPasswordToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or expired Try Again", 500));
  }
  user.password = undefined;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: `Your password changed successfully`,
  });
};

const changePassword = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const { id } = req.user;

  if (!oldPassword || !newPassword) {
    return next(new AppError("All fields are mandatory", 400));
  }

  const user = await User.findById(id).select("+password");

  if (!user) {
    return next(new AppError("User does not exist", 400));
  }

  const isPasswordValid = await user.comparePassword(oldPassword);

  if (!isPasswordValid) {
    return next(new AppError("Invalid old password", 400));
  }
  user.password = newPassword;

  await user.save();

  user.password = undefined;

  res.status(200).json({
    success: true,
    message: "Password changed successfully!",
  });
};
const updateUser = async (req, res, next) => {
  const { fullName } = req.body;
  const { id } = req.user;
  console.log("user id", id);

  try {
    const user = await User.findById(id);

    if (!user) {
      return next(new AppError("User does not exist", 400));
    }

    if (fullName) {
      user.fullName = fullName;
    }

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);

        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: "lms",
          width: 250,
          height: 250,
          gravity: "faces",
          crop: "fill",
        });

        if (result) {
          user.avatar.public_id = result.public_id;
          user.avatar.secure_url = result.secure_url;

          // Remove file from server
          // await fs.rm(file.path);
          fs.rm(`uploads/${req.file.filename}`);
        }
      }
    }

    await user.save();
    // Fetch the updated user data

    res.status(200).json({
      success: true,
      message: "User details updated successfully!",
      user: updateUser,
    });
  } catch (error) {
    return next(new AppError(error.message || "Error updating user", 500));
  }
};

// const updateUser = async (req, res, next) => {
//   // Destructuring the necessary data from the req object
//   const { fullName } = req.body;
//   const { id } = req.params;

//   const user = await User.findById(id);

//   if (!user) {
//     return next(new AppError("Invalid user id or user does not exist"));
//   }

//   if (fullName) {
//     user.fullName = fullName;
//   }

//   // Run only if user sends a file
//   if (req.file) {
//     // Deletes the old image uploaded by the user
//     await cloudinary.v2.uploader.destroy(user.avatar.public_id);

//     try {
//       const result = await cloudinary.v2.uploader.upload(req.file.path, {
//         folder: "lms", // Save files in a folder named lms
//         width: 250,
//         height: 250,
//         gravity: "faces", // This option tells cloudinary to center the image around detected faces (if any) after cropping or resizing the original image
//         crop: "fill",
//       });

//       // If success
//       if (result) {
//         // Set the public_id and secure_url in DB
//         user.avatar.public_id = result.public_id;
//         user.avatar.secure_url = result.secure_url;

//         // After successful upload remove the file from local storage
//         fs.rm(`uploads/${req.file.filename}`);
//       }
//     } catch (error) {
//       return next(
//         new AppError(error || "File not uploaded, please try again", 400)
//       );
//     }
//   }

//   // Save the user object
//   await user.save();

//   res.status(200).json({
//     success: true,
//     message: "User details updated successfully",
//   });
// };

export {
  register,
  login,
  logout,
  getProfile,
  forgotPassword,
  resetPassword,
  changePassword,
  updateUser,
};
