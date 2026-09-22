const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    subscriptionId: {
      type: String,
      trim: true,
      default: "",
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    billingCycle: {
      type: String,
      enum: ["Monthly", "Yearly"],
      default: "Monthly",
    },

    price: {
      type: Number,
      default: 0,
    },

    startDate: {
      type: String,
      default: "",
    },

    endDate: {
      type: String,
      default: "",
    },

    nextBillingDate: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "Active",
        "Pending",
        "Expired",
        "Cancelled",
      ],
      default: "Active",
    },

    paymentStatus: {
      type: String,
      enum: [
        "Paid",
        "Pending",
        "Failed",
        "Refunded",
      ],
      default: "Paid",
    },

    paymentMethod: {
      type: String,
      enum: [
        "UPI",
        "Card",
        "PayPal",
        "Net Banking",
        "Wallet",
        "Cash",
      ],
      default: "UPI",
    },

    transactionId: {
      type: String,
      trim: true,
      default: "",
    },

    autoRenewal: {
      type: Boolean,
      default: true,
    },

    lastPayment: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Subscription",
  subscriptionSchema
);