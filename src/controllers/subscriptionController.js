const Subscription = require("../models/Subscription");
const User = require("../models/User");
const Plan = require("../models/Plan");

/* =========================================
   HELPER: MongoDB ObjectId check
========================================= */

const isObjectId = (value) =>
  /^[0-9a-fA-F]{24}$/.test(String(value || "").trim());

/* =========================================
   HELPER: User ID resolve karo (naam ya ID)
========================================= */

const resolveUserId = async (userValue) => {
  if (!userValue) return null;

  /* Agar already ObjectId hai */
  if (isObjectId(userValue)) {
    const user = await User.findById(userValue);
    return user ? user._id : null;
  }

  /* Naam/username/email se dhundo */
  const user = await User.findOne({
    $or: [
      { name: String(userValue).trim() },
      { username: String(userValue).trim() },
      { email: String(userValue).trim() },
    ],
  });

  return user ? user._id : null;
};

/* =========================================
   HELPER: Plan ID resolve karo (naam ya ID)
========================================= */

const resolvePlanId = async (planValue) => {
  if (!planValue) return null;

  /* Agar already ObjectId hai */
  if (isObjectId(planValue)) {
    const plan = await Plan.findById(planValue);
    return plan ? plan._id : null;
  }

  /* Naam se dhundo */
  const plan = await Plan.findOne({
    $or: [
      { name: String(planValue).trim() },
      { planName: String(planValue).trim() },
    ],
  });

  return plan ? plan._id : null;
};

/* =========================================
   GET ALL SUBSCRIPTIONS
========================================= */

const getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find()
      .populate("user", "name username email avatar profileImage")
      .populate("plan", "name price billingCycle")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      data: subscriptions,
    });
  } catch (error) {
    console.error("GET SUBSCRIPTIONS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch subscriptions",
      error: error.message,
    });
  }
};

/* =========================================
   GET SUBSCRIPTION BY ID
========================================= */

const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findById(id)
      .populate("user", "name username email avatar profileImage")
      .populate("plan", "name price billingCycle");

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error("GET SUBSCRIPTION ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch subscription",
      error: error.message,
    });
  }
};

/* =========================================
   CREATE SUBSCRIPTION
   ✅ user aur plan ID ya naam dono accept karega
========================================= */

const createSubscription = async (req, res) => {
  try {
    const data = { ...req.body };

    /* -------- USER resolve -------- */
    if (data.user) {
      const userId = await resolveUserId(data.user);

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: `User "${data.user}" not found. Please select a valid user.`,
        });
      }

      data.user = userId;
    } else if (data.userId) {
      const userId = await resolveUserId(data.userId);

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: `User not found.`,
        });
      }

      data.user = userId;
      delete data.userId;
    }

    /* -------- PLAN resolve -------- */
    if (data.plan) {
      const planId = await resolvePlanId(data.plan);

      if (!planId) {
        return res.status(400).json({
          success: false,
          message: `Plan "${data.plan}" not found. Please select a valid plan.`,
        });
      }

      data.plan = planId;
    } else if (data.planId) {
      const planId = await resolvePlanId(data.planId);

      if (!planId) {
        return res.status(400).json({
          success: false,
          message: `Plan not found.`,
        });
      }

      data.plan = planId;
      delete data.planId;
    }

    /* -------- Extra fields hatao -------- */
    delete data.id;
    delete data._id;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.__v;
    delete data.userName;
    delete data.planName;

    /* -------- Create -------- */
    const subscription = await Subscription.create(data);

    await subscription.populate(
      "user",
      "name username email avatar profileImage"
    );

    await subscription.populate(
      "plan",
      "name price billingCycle"
    );

    console.log(
      "✅ SUBSCRIPTION CREATED:",
      subscription._id
    );

    res.status(201).json({
      success: true,
      message: "Subscription created successfully",
      data: subscription,
    });
  } catch (error) {
    console.error("CREATE SUBSCRIPTION ERROR:", error);

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to create subscription",
    });
  }
};

/* =========================================
   UPDATE SUBSCRIPTION
   ✅ user aur plan ID ya naam dono accept karega
========================================= */

const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    /* -------- USER resolve -------- */
    if (data.user) {
      const userId = await resolveUserId(data.user);

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: `User "${data.user}" not found.`,
        });
      }

      data.user = userId;
    } else if (data.userId) {
      const userId = await resolveUserId(data.userId);

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: `User not found.`,
        });
      }

      data.user = userId;
      delete data.userId;
    }

    /* -------- PLAN resolve -------- */
    if (data.plan) {
      const planId = await resolvePlanId(data.plan);

      if (!planId) {
        return res.status(400).json({
          success: false,
          message: `Plan "${data.plan}" not found.`,
        });
      }

      data.plan = planId;
    } else if (data.planId) {
      const planId = await resolvePlanId(data.planId);

      if (!planId) {
        return res.status(400).json({
          success: false,
          message: `Plan not found.`,
        });
      }

      data.plan = planId;
      delete data.planId;
    }

    /* -------- Extra fields hatao -------- */
    delete data.id;
    delete data._id;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.__v;
    delete data.userName;
    delete data.planName;

    /* -------- Update -------- */
    const subscription =
      await Subscription.findByIdAndUpdate(
        id,
        data,
        {
          new: true,
          runValidators: true,
        }
      )
        .populate(
          "user",
          "name username email avatar profileImage"
        )
        .populate(
          "plan",
          "name price billingCycle"
        );

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    console.log(
      "✅ SUBSCRIPTION UPDATED:",
      subscription._id
    );

    res.status(200).json({
      success: true,
      message: "Subscription updated successfully",
      data: subscription,
    });
  } catch (error) {
    console.error("UPDATE SUBSCRIPTION ERROR:", error);

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to update subscription",
    });
  }
};

/* =========================================
   DELETE SUBSCRIPTION
========================================= */

const deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription =
      await Subscription.findById(id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    await Subscription.findByIdAndDelete(id);

    console.log(
      "✅ SUBSCRIPTION DELETED:",
      id
    );

    res.status(200).json({
      success: true,
      message: "Subscription deleted successfully",
      data: {
        _id: subscription._id,
      },
    });
  } catch (error) {
    console.error("DELETE SUBSCRIPTION ERROR:", error);

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to delete subscription",
    });
  }
};

/* =========================================
   EXPORT
========================================= */

module.exports = {
  getSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  deleteSubscription,
};
