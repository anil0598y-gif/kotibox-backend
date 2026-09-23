const express = require("express");

const {
  getSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  deleteSubscription,
} = require("../controllers/subscriptionController");

const router = express.Router();

/* =========================================
   GET ALL SUBSCRIPTIONS
========================================= */

router.get("/", getSubscriptions);

/* =========================================
   GET SUBSCRIPTION BY ID
========================================= */

router.get("/:id", getSubscriptionById);

/* =========================================
   CREATE SUBSCRIPTION
========================================= */

router.post("/", createSubscription);

/* =========================================
   UPDATE SUBSCRIPTION
========================================= */

router.put("/:id", updateSubscription);

/* =========================================
   DELETE SUBSCRIPTION
========================================= */

router.delete("/:id", deleteSubscription);

module.exports = router;
