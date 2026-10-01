const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");

const User = require("../models/User");
const Plan = require("../models/Plan");

const { verifyUserToken } = require("./userAuthRoutes");

/* =========================================
   RAZORPAY INSTANCE
========================================= */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* =========================================
   ✅ GET RAZORPAY KEY (Frontend ke liye)
========================================= */
router.get("/key", (req, res) => {
  res.status(200).json({
    success: true,
    key: process.env.RAZORPAY_KEY_ID,
  });
});

/* =========================================
   ✅ CREATE ORDER
========================================= */
router.post("/create-order", verifyUserToken, async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user._id;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "planId is required",
      });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    // ✅ Free plan
    if (plan.name.toLowerCase() === "free" || plan.price === 0) {
      await User.findByIdAndUpdate(userId, {
        plan: "Free",
        planId: null,
        subscriptionStatus: "inactive",
        subscriptionStart: null,
        subscriptionEnd: null,
      });

      return res.status(200).json({
        success: true,
        isFree: true,
        message: "Plan changed to Free",
      });
    }

    // ✅ Razorpay order
    const amountInPaise = Math.round(plan.price * 100);

    const options = {
      amount: amountInPaise,
      currency: plan.currency || "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: String(userId),
        planId: String(plan._id),
        planName: plan.name,
      },
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      plan: {
        _id: plan._id,
        name: plan.name,
        price: plan.price,
        billingCycle: plan.billingCycle,
      },
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create order",
    });
  }
});

/* =========================================
   ✅ VERIFY PAYMENT
========================================= */
router.post("/verify-payment", verifyUserToken, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
    } = req.body;

    const userId = req.user._id;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !planId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    const now = new Date();
    const endDate = new Date(now);

    if (plan.billingCycle === "Yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        plan: plan.name,
        planId: plan._id,
        subscriptionStatus: "active",
        subscriptionStart: now,
        subscriptionEnd: endDate,
      },
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: `Successfully subscribed to ${plan.name}`,
      user: updatedUser,
      payment: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      },
    });
  } catch (error) {
    console.error("VERIFY PAYMENT ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Payment verification failed",
    });
  }
});

module.exports = router;