// import subscriptions from "razorpay/dist/types/subscriptions.js";

import User from "../model/user.schema.js";
import { razorpay } from "../server.js";
import AppError from "../utils/error.util.js";
import crypto from "crypto";
import Payment from "../model/payment.Schema.js";
import { log } from "console";

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
    console.log(subscription);

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

    await Payment.create({
      razorpay_payment_id,
      razorpay_signature,
      razorpay_subscription_id,
    });

    user.subscription.status = "active";
    await user.save();

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
    });
  } catch (error) {
    return next(new AppError(error.message || "Try again", 402));
  }
};

/**
 * @CANCEL_SUBSCRIPTION
 * @ROUTE @POST {{URL}}/api/v1/payments/unsubscribe
 * @ACCESS Private (Logged in user only)
 */
const cancelSubscription = async (req, res, next) => {
  const { id } = req.user;

  // Finding the user
  const user = await User.findById(id);

  // Checking the user role
  if (user.role === "ADMIN") {
    return next(
      new AppError("Admin does not need to cannot cancel subscription", 400)
    );
  }

  // Finding subscription ID from subscription
  const subscriptionId = user.subscription.id;

  // Creating a subscription using razorpay that we imported from the server
  try {
    const subscription = await razorpay.subscriptions.cancel(
      subscriptionId // subscription id
    );

    // Adding the subscription status to the user account
    user.subscription.status = subscription.status;

    // Saving the user object
    await user.save();
  } catch (error) {
    // Returning error if any, and this error is from razorpay so we have statusCode and message built in
    return next(new AppError(error.error.description, error.statusCode));
  }

  // // Finding the payment using the subscription ID
  // const payment = await Payment.findOne({
  //   razorpay_subscription_id: subscriptionId,
  // });

  // // Getting the time from the date of successful payment (in milliseconds)
  // const timeSinceSubscribed = Date.now() - payment.createdAt;

  // // refund period which in our case is 14 days
  // const refundPeriod = 14 * 24 * 60 * 60 * 1000;

  // // Check if refund period has expired or not
  // if (refundPeriod <= timeSinceSubscribed) {
  //   return next(
  //     new AppError(
  //       "Refund period is over, so there will not be any refunds provided.",
  //       400
  //     )
  //   );
  // }

  // // If refund period is valid then refund the full amount that the user has paid
  // await razorpay.payments.refund(payment.razorpay_payment_id, {
  //   speed: "optimum", // This is required
  // });

  // user.subscription.id = undefined; // Remove the subscription ID from user DB
  // user.subscription.status = undefined; // Change the subscription Status in user DB

  // await user.save();
  // await payment.remove();

  // // Send the response
  // res.status(200).json({
  //   success: true,
  //   message: "Subscription canceled successfully",
  // });
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
