const Plan = require("../models/Plan");

/* =========================================
   GET ALL PLANS
========================================= */

const getPlans = async (req, res) => {
  try {
    const plans = await Plan.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: plans.length,
      data: plans,
    });
  } catch (error) {
    console.error("GET PLANS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch plans",
      error: error.message,
    });
  }
};

/* =========================================
   GET PLAN BY ID
========================================= */

const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await Plan.findById(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error("GET PLAN ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch plan",
      error: error.message,
    });
  }
};

/* =========================================
   CREATE PLAN
========================================= */

const createPlan = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      currency,
      billingCycle,
      features,
      maxQuality,
      adsFree,
      downloads,
      maxDevices,
      status,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Plan name is required",
      });
    }

    let parsedFeatures = [];

    if (features) {
      try {
        parsedFeatures =
          typeof features === "string"
            ? JSON.parse(features)
            : features;
      } catch (error) {
        parsedFeatures = [];
      }
    }

    const plan = await Plan.create({
      name: name.trim(),

      description: description?.trim() || "",

      price: Number(price) || 0,

      currency: currency?.trim() || "INR",

      billingCycle: billingCycle || "Monthly",

      features: Array.isArray(parsedFeatures) ? parsedFeatures : [],

      maxQuality: maxQuality?.trim() || "320kbps",

      adsFree: adsFree === true || adsFree === "true",

      downloads: downloads === true || downloads === "true",

      maxDevices: Number(maxDevices) || 1,

      status: status || "Active",
    });

    res.status(201).json({
      success: true,
      message: "Plan created successfully",
      data: plan,
    });
  } catch (error) {
    console.error("CREATE PLAN ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create plan",
      error: error.message,
    });
  }
};

/* =========================================
   UPDATE PLAN
========================================= */

const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await Plan.findById(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    const {
      name,
      description,
      price,
      currency,
      billingCycle,
      features,
      maxQuality,
      adsFree,
      downloads,
      maxDevices,
      status,
    } = req.body;

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({
          success: false,
          message: "Plan name is required",
        });
      }

      plan.name = String(name).trim();
    }

    if (description !== undefined) {
      plan.description = String(description).trim();
    }

    if (price !== undefined) {
      plan.price = Number(price) || 0;
    }

    if (currency !== undefined) {
      plan.currency = String(currency).trim();
    }

    if (billingCycle !== undefined) {
      plan.billingCycle = billingCycle;
    }

    if (features !== undefined) {
      try {
        const parsedFeatures =
          typeof features === "string"
            ? JSON.parse(features)
            : features;

        plan.features = Array.isArray(parsedFeatures)
          ? parsedFeatures
          : [];
      } catch (error) {
        plan.features = [];
      }
    }

    if (maxQuality !== undefined) {
      plan.maxQuality = String(maxQuality).trim();
    }

    if (adsFree !== undefined) {
      plan.adsFree = adsFree === true || adsFree === "true";
    }

    if (downloads !== undefined) {
      plan.downloads = downloads === true || downloads === "true";
    }

    if (maxDevices !== undefined) {
      plan.maxDevices = Number(maxDevices) || 1;
    }

    if (status !== undefined) {
      plan.status = status;
    }

    await plan.save();

    res.status(200).json({
      success: true,
      message: "Plan updated successfully",
      data: plan,
    });
  } catch (error) {
    console.error("UPDATE PLAN ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update plan",
      error: error.message,
    });
  }
};

/* =========================================
   DELETE PLAN
========================================= */

const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await Plan.findById(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    await Plan.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Plan deleted successfully",
      data: {
        _id: plan._id,
      },
    });
  } catch (error) {
    console.error("DELETE PLAN ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete plan",
      error: error.message,
    });
  }
};

/* =========================================
   EXPORT
========================================= */

module.exports = {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
};
