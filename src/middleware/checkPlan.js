const User = require("../models/User");

/* =========================================
   ✅ PLAN FEATURES (Backend)
========================================= */
const PLAN_FEATURES = {
  Free: ["play", "search", "like", "playlist"],
  Basic: ["play", "search", "like", "playlist", "download", "hd"],
  Pro: [
    "play",
    "search",
    "like",
    "playlist",
    "download",
    "hd",
    "offline",
  ],
  Premium: [
    "play",
    "search",
    "like",
    "playlist",
    "download",
    "hd",
    "offline",
    "hires",
  ],
};

/* =========================================
   ✅ CHECK PLAN MIDDLEWARE
========================================= */
const checkPlan = (requiredFeature) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?._id || req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      const plan = user.plan || "Free";
      const allowedFeatures =
        PLAN_FEATURES[plan] || PLAN_FEATURES.Free;

      if (!allowedFeatures.includes(requiredFeature)) {
        return res.status(403).json({
          success: false,
          message: `Ye feature ${plan} plan mein nahi hai. Upgrade karo!`,
          upgradeRequired: true,
          currentPlan: plan,
          requiredFeature,
        });
      }

      req.userPlan = plan;
      req.userPlanFeatures = allowedFeatures;
      next();
    } catch (err) {
      console.error("CHECK PLAN ERROR:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Plan check failed",
      });
    }
  };
};

module.exports = checkPlan;