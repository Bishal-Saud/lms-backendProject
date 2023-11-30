// import subscriptions from "razorpay/dist/types/subscriptions.js";

import User from "../model/user.schema.js";
import { razorpay } from "../server.js";
import AppError from "../utils/error.util.js";
import crypto from "crypto";
import Payment from "../model/payment.Schema.js";
import { error, log } from "console";

const getrazorpayApiKey = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: "Razorpay_Key Received",
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    return next(new AppError(error.message || "Try again", 402));
  }
};

const buySubscription = async (req, res, next) => {
  try {
    const { id } = req.user;
    const user = await User.findById(id);
    // console.log("user id is available", user);

    if (!user) {
      return next(new AppError("unauthorized, please login", 402));
    }

    if (user.role === "ADMIN") {
      return next(new AppError("Admin cannot purchase a Subscription", 402));
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID,
      customer_notify: 1,
      total_count: 12,
    });

    user.subscription.id = subscription.id;
    user.subscription.status = subscription.status;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Subscribed Successfully",
      subscription_id: subscription.id,
    });
  } catch (error) {
    console.log("Error in buySubscription", error);
    return next(new AppError(error.message || "Try Again", 402));
  }
};

const verifySubscription = async (req, res, next) => {
  try {
    const { id } = req.user;
    const {
      razorpay_payment_id,
      razorpay_signature,
      razorpay_subscription_id,
    } = req.body;

    const user = await User.findById(id);
    // console.log(user);

    if (!user) {
      return next(new AppError("unauthorized, please login", 402));
    }
    const subscriptionId = user.subscription.id;
    // console.log(subscriptionId);

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_payment_id}|${subscriptionId}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return next(
        new AppError("Payment not verified, please try again! ", 400)
      );
    }

    if (generatedSignature === razorpay_signature) {
      console.log("true");
    } else {
      console.log("false");
    }

    await Payment.create({
      razorpay_payment_id,
      razorpay_signature,
      razorpay_subscription_id,
    });

    user.subscription.status = "active";
    await user.save();

    console.log("user", user?.subscription?.status);
    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
    });
  } catch (error) {
    return next(new AppError(error.message || "Try again", 402));
  }
};

const cancelSubscription = async (req, res, next) => {
  try {
    const { id } = req.user;
    const user = await User.findById(id);

    if (!user) {
      return next(new AppError("unauthorized, please login", 402));
    }

    if (user.role === "ADMIN") {
      return next(new AppError("Admin cannot purchase a Subscription", 402));
    }

    const subscriptionId = await user.subscription.id;
    const subscription = await razorpay.subscriptions.cancel(subscriptionId);

    user.subscription.status = subscription.status;

    await user.save();
  } catch (error) {
    return next(
      new AppError(error.message || "Unable to purchase a Subscription", 402)
    );
  }
};

const allPayment = async (req, res, next) => {
  try {
    const { count } = req.query;

    const subscriptions = await razorpay.subscriptions.all({
      count: count || 10,
    });

    res.status(200).json({
      success: true,
      message: "All payment details",
      subscriptions,
    });
  } catch (error) {
    return next(
      new AppError(
        error.message || "Unable to get details of Subscription Payment",
        402
      )
    );
  }
};

export {
  getrazorpayApiKey,
  buySubscription,
  verifySubscription,
  cancelSubscription,
  allPayment,
};
