import { Router } from "express";
import { allPayment, buySubscription, cancelSubscription, getrazorpayApiKey, verifySubscription } from "../Controllers/payment.contoller.js";
import { authorizedRoles, isLoggedin } from "../middleware/auth.middleware.js";
const router = Router()

router.route('/razorpay-key')
.get(
    isLoggedin,
    getrazorpayApiKey
    )

router.route('/subscribe')
.post(
    isLoggedin,
    buySubscription
    )

router.route('/verify')
.post(
    isLoggedin,
    verifySubscription
    )

router.route('/unsubscribe')
.post(
    isLoggedin,
    cancelSubscription
    )

router.route('/')
.get(
    isLoggedin,
    authorizedRoles('ADMIN'),
    allPayment
    )

export default router

