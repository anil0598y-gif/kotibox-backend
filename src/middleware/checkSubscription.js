const User = require("../models/User");

/* =========================================
   ✅ CHECK SUBSCRIPTION EXPIRY
   Har request pe check karega
========================================= */

const checkSubscription = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id || req.userId;

    if (!userId) {
      return next();
    }

    const user = await User.findById(userId);

    if (!user) {
      return next();
    }

    // ✅ Check if subscription expired
    const now = new Date();

    if (
      user.subscriptionEnd &&
      user.subscriptionStatus === "active" &&
      new Date(user.subscriptionEnd) < now
    ) {
      console.log(
        `⏰ Subscription expired for user ${user.email} — downgrading to Free`
      );

      user.plan = "Free";
      user.planId = null;
      user.subscriptionStatus = "expired";
      user.subscriptionStart = null;
      // Note: subscriptionEnd rakhte hain history ke liye

      await user.save({ validateBeforeSave: false });

      // ✅ Update req.user bhi
      req.user = user;
    }

    next();
  } catch (error) {
    console.error("CHECK SUBSCRIPTION ERROR:", error);
    next();
  }
};

module.exports = checkSubscription;