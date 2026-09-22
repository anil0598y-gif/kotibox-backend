const LoginHistory = require("../models/LoginHistory");

/* =========================================================
   GET MY LOGIN HISTORY
========================================================= */

exports.getMyLoginHistory = async (req, res) => {
  try {
    const history = await LoginHistory.find({
      admin: req.admin.id,
    })
      .sort({ loginAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error("GET LOGIN HISTORY ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================================
   CLEAR MY LOGIN HISTORY
========================================================= */

exports.clearMyLoginHistory = async (req, res) => {
  try {
    await LoginHistory.deleteMany({
      admin: req.admin.id,
    });

    res.status(200).json({
      success: true,
      message: "Login history cleared",
    });
  } catch (error) {
    console.error("CLEAR LOGIN HISTORY ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};