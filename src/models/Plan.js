const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    price: {
      type: Number,
      default: 0,
    },

    currency: {
      type: String,
      default: "INR",
      trim: true,
    },

    billingCycle: {
      type: String,
      enum: ["Monthly", "Yearly"],
      default: "Monthly",
    },

    features: {
      type: Array,
      default: [],
    },

    maxQuality: {
      type: String,
      default: "320kbps",
      trim: true,
    },

    adsFree: {
      type: Boolean,
      default: false,
    },

    downloads: {
      type: Boolean,
      default: false,
    },

    maxDevices: {
      type: Number,
      default: 1,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Plan", planSchema);
