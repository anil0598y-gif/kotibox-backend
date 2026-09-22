const Ad = require("../models/Ad");
const fs = require("fs");
const path = require("path");

/* =========================================================
   GET FILE URL
   upload.js ads ko is hisaab se save karta hai:
   - Videos → public/uploads/ads/videos/
   - Images → public/uploads/ads/images/
   - Other  → public/uploads/ads/
========================================================= */

const getAdFileUrl = (file) => {
  if (!file) return "";

  const mimetype = file.mimetype || "";

  if (mimetype.startsWith("video/")) {
    return `/uploads/ads/videos/${file.filename}`;
  }

  if (mimetype.startsWith("image/")) {
    return `/uploads/ads/images/${file.filename}`;
  }

  return `/uploads/ads/${file.filename}`;
};

/* =========================================================
   DELETE FILE
========================================================= */

const deleteFile = (fileUrl) => {
  try {
    if (!fileUrl) return;

    /* External URL skip करें */
    if (
      fileUrl.startsWith("http://") ||
      fileUrl.startsWith("https://") ||
      fileUrl.startsWith("blob:") ||
      fileUrl.startsWith("data:")
    ) {
      return;
    }

    const cleanPath = String(fileUrl)
      .replace(/^\/+/, "")
      .replace(/^\\+/, "");

    const filePath = path.join(
      __dirname,
      "../../public",
      cleanPath
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("🗑️ File deleted:", filePath);
    }
  } catch (error) {
    console.error(
      "❌ File delete error:",
      error.message
    );
  }
};

/* =========================================================
   CLEANUP UPLOADED FILES (error case)
========================================================= */

const cleanupUploadedFiles = (files) => {
  if (!files) return;

  try {
    Object.values(files)
      .flat()
      .forEach((file) => {
        if (!file?.path) return;

        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (err) {
          console.error(
            "Cleanup error:",
            err.message
          );
        }
      });
  } catch (error) {
    console.error(
      "Uploaded files cleanup error:",
      error.message
    );
  }
};

/* =========================================================
   GET ALL ADS
========================================================= */

exports.getAds = async (req, res) => {
  try {
    const ads = await Ad.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: ads,
    });
  } catch (error) {
    console.error("GET ADS ERROR:", error);

    res.status(500).json({
      success: false,
      message:
        error.message || "Failed to fetch ads",
    });
  }
};

/* =========================================================
   GET SINGLE AD
========================================================= */

exports.getAdById = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found",
      });
    }

    res.status(200).json({
      success: true,
      data: ad,
    });
  } catch (error) {
    console.error("GET AD ERROR:", error);

    res.status(500).json({
      success: false,
      message:
        error.message || "Failed to fetch ad",
    });
  }
};

/* =========================================================
   CREATE AD — ✅ FIXED (Files handle)
========================================================= */

exports.createAd = async (req, res) => {
  try {
    console.log("");
    console.log("=================================");
    console.log("📥 CREATE AD REQUEST");
    console.log("=================================");
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    /* FILES */

    const mediaFile = req.files?.mediaFile?.[0];
    const thumbnailFile =
      req.files?.thumbnailFile?.[0];

    /* ✅ Media URL — file हो तो path बनाओ */
    let mediaUrl =
      req.body.mediaUrl &&
      String(req.body.mediaUrl).trim()
        ? String(req.body.mediaUrl).trim()
        : "";

    if (mediaFile) {
      mediaUrl = getAdFileUrl(mediaFile);

      console.log(
        "🎬 Media file → URL:",
        mediaUrl
      );
    }

    /* ✅ Thumbnail URL */
    let thumbnailUrl =
      req.body.thumbnailUrl &&
      String(req.body.thumbnailUrl).trim()
        ? String(req.body.thumbnailUrl).trim()
        : "";

    if (thumbnailFile) {
      thumbnailUrl = getAdFileUrl(thumbnailFile);

      console.log(
        "🖼️ Thumbnail file → URL:",
        thumbnailUrl
      );
    }

    /* ✅ Type auto-detect */
    let adType = req.body.type || "video";

    if (mediaFile) {
      if (
        mediaFile.mimetype?.startsWith("video/")
      ) {
        adType = "video";
      } else if (
        mediaFile.mimetype?.startsWith("image/")
      ) {
        adType = "image";
      }
    }

    /* ✅ Payload बनाओ */
    const payload = {
      ...req.body,

      type: adType,
      mediaUrl,
      thumbnailUrl,

      mediaFileName:
        mediaFile?.originalname ||
        req.body.mediaFileName ||
        "",

      thumbnailFileName:
        thumbnailFile?.originalname ||
        req.body.thumbnailFileName ||
        "",

      status:
        req.body.status === "active" ||
        req.body.status === true
          ? "active"
          : req.body.status || "paused",

      updatedAt: new Date().toISOString(),
    };

    /* Numbers */
    if (payload.duration !== undefined) {
      payload.duration =
        Number(payload.duration) || 0;
    }
    if (payload.skipAfter !== undefined) {
      payload.skipAfter =
        Number(payload.skipAfter) || 0;
    }
    if (payload.priority !== undefined) {
      payload.priority =
        Number(payload.priority) || 1;
    }

    /* JSON fields */
    if (
      payload.placements &&
      typeof payload.placements === "string"
    ) {
      try {
        payload.placements = JSON.parse(
          payload.placements
        );
      } catch {
        payload.placements = [payload.placements];
      }
    }

    if (
      payload.targetTitles &&
      typeof payload.targetTitles === "string"
    ) {
      try {
        payload.targetTitles = JSON.parse(
          payload.targetTitles
        );
      } catch {
        payload.targetTitles = [];
      }
    }

    /* ✅ Create */
    const ad = await Ad.create(payload);

    console.log("=================================");
    console.log("✅ AD CREATED:", ad._id);
    console.log("MEDIA URL:", ad.mediaUrl);
    console.log(
      "THUMBNAIL URL:",
      ad.thumbnailUrl
    );
    console.log("=================================");

    res.status(201).json({
      success: true,
      data: ad,
    });
  } catch (error) {
    console.error("❌ CREATE AD ERROR:", error);

    cleanupUploadedFiles(req.files);

    res.status(400).json({
      success: false,
      message:
        error.message || "Failed to create ad",
    });
  }
};

/* =========================================================
   UPDATE AD — ✅ FIXED (Files handle)
========================================================= */

exports.updateAd = async (req, res) => {
  try {
    console.log("");
    console.log("=================================");
    console.log("✏️ UPDATE AD REQUEST");
    console.log("=================================");
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    const existingAd = await Ad.findById(
      req.params.id
    );

    if (!existingAd) {
      cleanupUploadedFiles(req.files);

      return res.status(404).json({
        success: false,
        message: "Ad not found",
      });
    }

    /* FILES */

    const mediaFile = req.files?.mediaFile?.[0];
    const thumbnailFile =
      req.files?.thumbnailFile?.[0];

    /* ✅ Payload */
    const payload = {
      ...req.body,
    };

    /* ✅ अगर नया media file आया → पुरानी delete + नई set */
    if (mediaFile) {
      const newMediaUrl = getAdFileUrl(mediaFile);

      if (existingAd.mediaUrl) {
        deleteFile(existingAd.mediaUrl);
      }

      payload.mediaUrl = newMediaUrl;
      payload.mediaFileName =
        mediaFile.originalname || "";

      if (mediaFile.mimetype?.startsWith("video/")) {
        payload.type = "video";
      } else if (
        mediaFile.mimetype?.startsWith("image/")
      ) {
        payload.type = "image";
      }

      console.log(
        "🎬 New media file:",
        newMediaUrl
      );
    } else if (
      req.body.mediaUrl !== undefined &&
      String(req.body.mediaUrl).trim()
    ) {
      payload.mediaUrl = String(
        req.body.mediaUrl
      ).trim();
    }

    /* ✅ Thumbnail */
    if (thumbnailFile) {
      const newThumbUrl =
        getAdFileUrl(thumbnailFile);

      if (existingAd.thumbnailUrl) {
        deleteFile(existingAd.thumbnailUrl);
      }

      payload.thumbnailUrl = newThumbUrl;
      payload.thumbnailFileName =
        thumbnailFile.originalname || "";
    } else if (
      req.body.thumbnailUrl !== undefined &&
      String(req.body.thumbnailUrl).trim()
    ) {
      payload.thumbnailUrl = String(
        req.body.thumbnailUrl
      ).trim();
    }

    /* Numbers */
    if (payload.duration !== undefined) {
      payload.duration =
        Number(payload.duration) || 0;
    }
    if (payload.skipAfter !== undefined) {
      payload.skipAfter =
        Number(payload.skipAfter) || 0;
    }
    if (payload.priority !== undefined) {
      payload.priority =
        Number(payload.priority) || 1;
    }

    /* JSON fields */
    if (
      payload.placements &&
      typeof payload.placements === "string"
    ) {
      try {
        payload.placements = JSON.parse(
          payload.placements
        );
      } catch {
        payload.placements = [payload.placements];
      }
    }

    if (
      payload.targetTitles &&
      typeof payload.targetTitles === "string"
    ) {
      try {
        payload.targetTitles = JSON.parse(
          payload.targetTitles
        );
      } catch {
        payload.targetTitles = [];
      }
    }

    payload.updatedAt = new Date().toISOString();

    /* ✅ Update */
    const ad = await Ad.findByIdAndUpdate(
      req.params.id,
      payload,
      {
        new: true,
        runValidators: true,
      }
    );

    console.log("=================================");
    console.log("✅ AD UPDATED:", ad._id);
    console.log("MEDIA URL:", ad.mediaUrl);
    console.log("=================================");

    res.status(200).json({
      success: true,
      data: ad,
    });
  } catch (error) {
    console.error("❌ UPDATE AD ERROR:", error);

    cleanupUploadedFiles(req.files);

    res.status(400).json({
      success: false,
      message:
        error.message || "Failed to update ad",
    });
  }
};

/* =========================================================
   DELETE AD
========================================================= */

exports.deleteAd = async (req, res) => {
  try {
    const ad = await Ad.findByIdAndDelete(
      req.params.id
    );

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found",
      });
    }

    /* Delete files */
    if (ad.mediaUrl) deleteFile(ad.mediaUrl);
    if (ad.thumbnailUrl)
      deleteFile(ad.thumbnailUrl);

    res.status(200).json({
      success: true,
      message: "Ad deleted successfully",
    });
  } catch (error) {
    console.error("DELETE AD ERROR:", error);

    res.status(500).json({
      success: false,
      message:
        error.message || "Failed to delete ad",
    });
  }
};