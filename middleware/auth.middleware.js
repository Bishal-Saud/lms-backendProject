import AppError from "../utils/error.util.js";
import jwt from "jsonwebtoken";

const isLoggedin = async (req, res, next) => {
  // console.log(req.user);
  try {
    const { token } = req.cookies;
    // console.log(token);
    if (!token) {
      return next(new AppError("Unauthenticated, please login again", 401));
    }

    const userDetails = await jwt.verify(token, process.env.JWT_SECRET);
    req.user = userDetails;
    next();
  } catch (error) {
    return next(new AppError(error.message, 401));
  }
};
const authorizedRoles =
  (...roles) =>
  async (req, res, next) => {
    const currentUserRole = req.user.role;
    if (!roles.includes(currentUserRole)) {
      return next(
        new AppError(
          "You do not have permission to access this , please try again !!",
          401
        )
      );
    }
    next();
  };

  const authorizedSubscriber = async(req,res,next) =>{
    const subscription = req.user.subscription;
    const currentUserRole = req.user.role;

    if(currentUserRole !== 'ADMIN' && subscription.status !== 'active'){
      return next(
        new AppError(
          "Please subscribe to access the route",
          401
        )
      );
    }
next()
  }

export { isLoggedin, authorizedRoles,authorizedSubscriber };
