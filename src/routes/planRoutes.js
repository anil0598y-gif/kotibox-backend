const express = require("express");

const {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
} = require("../controllers/planController");

const router = express.Router();

/* =========================================
   GET ALL PLANS
========================================= */

router.get("/", getPlans);

/* =========================================
   GET PLAN BY ID
========================================= */

router.get("/:id", getPlanById);

/* =========================================
   CREATE PLAN
========================================= */

router.post("/", createPlan);

/* =========================================
   UPDATE PLAN
========================================= */

router.put("/:id", updatePlan);

/* =========================================
   DELETE PLAN
========================================= */

router.delete("/:id", deletePlan);

module.exports = router;
