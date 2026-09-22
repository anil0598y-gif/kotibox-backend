const AdNetwork = require("../models/AdNetwork");

exports.getAdNetworks = async (req, res) => {
  try {
    const networks = await AdNetwork.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: networks,
    });
  } catch (error) {
    console.error("GET AD NETWORKS ERROR:", error);

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch ad networks",
    });
  }
};

exports.getAdNetworkById = async (req, res) => {
  try {
    const network = await AdNetwork.findById(
      req.params.id
    );

    if (!network) {
      return res.status(404).json({
        success: false,
        message: "Ad network not found",
      });
    }

    res.status(200).json({
      success: true,
      data: network,
    });
  } catch (error) {
    console.error("GET AD NETWORK ERROR:", error);

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch ad network",
    });
  }
};

exports.createAdNetwork = async (req, res) => {
  try {
    const network = await AdNetwork.create(req.body);

    res.status(201).json({
      success: true,
      data: network,
    });
  } catch (error) {
    console.error("CREATE AD NETWORK ERROR:", error);

    res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to create ad network",
    });
  }
};

exports.updateAdNetwork = async (req, res) => {
  try {
    const network = await AdNetwork.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!network) {
      return res.status(404).json({
        success: false,
        message: "Ad network not found",
      });
    }

    res.status(200).json({
      success: true,
      data: network,
    });
  } catch (error) {
    console.error("UPDATE AD NETWORK ERROR:", error);

    res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to update ad network",
    });
  }
};

exports.deleteAdNetwork = async (req, res) => {
  try {
    const network = await AdNetwork.findByIdAndDelete(
      req.params.id
    );

    if (!network) {
      return res.status(404).json({
        success: false,
        message: "Ad network not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Ad network deleted successfully",
    });
  } catch (error) {
    console.error("DELETE AD NETWORK ERROR:", error);

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to delete ad network",
    });
  }
};