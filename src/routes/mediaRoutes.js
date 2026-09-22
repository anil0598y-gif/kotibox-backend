const router = require("express").Router();

const fs = require("fs");
const path = require("path");

const Media = require("../models/Media");
const upload = require("../middleware/upload");

/* =========================================================
   DELETE PHYSICAL MEDIA FILE
========================================================= */

const deleteMediaFile = (filePath) => {
  if (!filePath) return;

  try {
    let absolutePath = filePath;

    /*
      Agar database me:
      /uploads/media/file.mp3

      hai to actual path:
      public/uploads/media/file.mp3
    */

    if (filePath.startsWith("/")) {
      absolutePath = path.join(
        __dirname,
        "../../public",
        filePath
      );
    }

    /*
      Windows path /uploads/media/... ke case me
      slash normalize karna
    */

    absolutePath =
      absolutePath.replace(/\//g, path.sep);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);

      console.log(
        "🗑️ Media file deleted:",
        absolutePath
      );
    }
  } catch (error) {
    console.error(
      "❌ Media physical file delete error:",
      error.message
    );
  }
};

/* =========================================================
   GET ALL MEDIA
========================================================= */

router.get("/", async (req, res) => {
  try {
    const media = await Media.find()
      .sort({
        createdAt: -1,
      });

    res.json({
      success: true,
      data: media,
    });
  } catch (error) {
    console.error(
      "❌ GET MEDIA ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Media fetch nahi ho paya.",
    });
  }
});

/* =========================================================
   GET SINGLE MEDIA
========================================================= */

router.get("/:id", async (req, res) => {
  try {
    const media =
      await Media.findById(
        req.params.id
      );

    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Media nahi mila.",
      });
    }

    res.json({
      success: true,
      data: media,
    });
  } catch (error) {
    console.error(
      "❌ GET SINGLE MEDIA ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Media fetch nahi ho paya.",
    });
  }
});

/* =========================================================
   CREATE / UPLOAD MEDIA
========================================================= */

router.post(
  "/",
  upload.single("file"),
  async (req, res) => {
    try {
      const data = {
        ...req.body,
      };

      /* -----------------------------------------
         UPLOADED FILE
      ----------------------------------------- */

      if (req.file) {
        const relativePath =
          `/uploads/media/${req.file.filename}`;

        data.url =
          relativePath;

        data.filePath =
          relativePath;

        data.fileName =
          req.file.filename;

        data.originalFileName =
          req.file.originalname;

        data.fileType =
          req.file.mimetype;

        /*
          Agar frontend ne size nahi bheja
          to uploaded file ka size save karo
        */

        if (
          !data.size &&
          req.file.size
        ) {
          data.size = String(
            req.file.size
          );
        }

        /*
          Format automatically
          extension se
        */

        if (!data.format) {
          data.format =
            path
              .extname(
                req.file.originalname
              )
              .replace(".", "")
              .toUpperCase();
        }

        /*
          Type automatically detect
        */

        if (!data.type) {
          if (
            req.file.mimetype.startsWith(
              "image/"
            )
          ) {
            data.type = "Image";
          } else if (
            req.file.mimetype.startsWith(
              "audio/"
            )
          ) {
            data.type = "Audio";
          } else if (
            req.file.mimetype.startsWith(
              "video/"
            )
          ) {
            data.type = "Video";
          } else {
            data.type = "File";
          }
        }
      }

      /* -----------------------------------------
         DEFAULTS
      ----------------------------------------- */

      if (!data.usedFor) {
        data.usedFor =
          "Other";
      }

      if (!data.status) {
        data.status =
          "Active";
      }

      /* -----------------------------------------
         CREATE DATABASE RECORD
      ----------------------------------------- */

      const media =
        await Media.create(
          data
        );

      console.log(
        "✅ Media created:",
        media._id
      );

      res.status(201).json({
        success: true,
        message:
          "Media uploaded successfully",
        data: media,
      });
    } catch (error) {
      console.error(
        "❌ CREATE MEDIA ERROR:",
        error
      );

      /*
        Agar database save fail ho gaya
        lekin file upload ho chuki hai,
        to uploaded file delete kar do.
      */

      if (req.file) {
        try {
          const uploadedPath =
            path.join(
              __dirname,
              "../../public/uploads/media",
              req.file.filename
            );

          if (
            fs.existsSync(
              uploadedPath
            )
          ) {
            fs.unlinkSync(
              uploadedPath
            );
          }
        } catch (fileError) {
          console.error(
            "❌ Failed to cleanup uploaded media:",
            fileError.message
          );
        }
      }

      res.status(500).json({
        success: false,
        message:
          error.message ||
          "Media upload nahi ho paya.",
      });
    }
  }
);

/* =========================================================
   UPDATE MEDIA
========================================================= */

router.put(
  "/:id",
  upload.single("file"),
  async (req, res) => {
    try {
      const existingMedia =
        await Media.findById(
          req.params.id
        );

      if (!existingMedia) {
        /*
          Agar new file upload hui hai
          to usko cleanup karo.
        */

        if (req.file) {
          try {
            const uploadedPath =
              path.join(
                __dirname,
                "../../public/uploads/media",
                req.file.filename
              );

            if (
              fs.existsSync(
                uploadedPath
              )
            ) {
              fs.unlinkSync(
                uploadedPath
              );
            }
          } catch (cleanupError) {
            console.error(
              "Cleanup error:",
              cleanupError.message
            );
          }
        }

        return res.status(404).json({
          success: false,
          message:
            "Media nahi mila.",
        });
      }

      const data = {
        ...req.body,
      };

      /* -----------------------------------------
         NEW FILE UPLOADED
      ----------------------------------------- */

      if (req.file) {
        const relativePath =
          `/uploads/media/${req.file.filename}`;

        data.url =
          relativePath;

        data.filePath =
          relativePath;

        data.fileName =
          req.file.filename;

        data.originalFileName =
          req.file.originalname;

        data.fileType =
          req.file.mimetype;

        data.size =
          data.size ||
          String(
            req.file.size
          );

        data.format =
          data.format ||
          path
            .extname(
              req.file.originalname
            )
            .replace(".", "")
            .toUpperCase();

        if (!data.type) {
          if (
            req.file.mimetype.startsWith(
              "image/"
            )
          ) {
            data.type = "Image";
          } else if (
            req.file.mimetype.startsWith(
              "audio/"
            )
          ) {
            data.type = "Audio";
          } else if (
            req.file.mimetype.startsWith(
              "video/"
            )
          ) {
            data.type = "Video";
          } else {
            data.type = "File";
          }
        }

        /*
          OLD FILE DELETE
        */

        if (
          existingMedia.filePath
        ) {
          deleteMediaFile(
            existingMedia.filePath
          );
        } else if (
          existingMedia.url
        ) {
          deleteMediaFile(
            existingMedia.url
          );
        }
      }

      /* -----------------------------------------
         REMOVE MEDIA FILE
         Frontend:
         removeFile=true
      ----------------------------------------- */

      const removeFile =
        req.body.removeFile ===
        "true" ||
        req.body.removeFile ===
        true;

      if (
        removeFile &&
        !req.file
      ) {
        if (
          existingMedia.filePath
        ) {
          deleteMediaFile(
            existingMedia.filePath
          );
        } else if (
          existingMedia.url
        ) {
          deleteMediaFile(
            existingMedia.url
          );
        }

        data.url = "";
        data.filePath = "";
        data.fileName = "";
        data.originalFileName =
          "";
      }

      /* -----------------------------------------
         UPDATE DATABASE
      ----------------------------------------- */

      const updatedMedia =
        await Media.findByIdAndUpdate(
          req.params.id,
          data,
          {
            new: true,
            runValidators: true,
          }
        );

      res.json({
        success: true,
        message:
          "Media updated successfully",
        data: updatedMedia,
      });
    } catch (error) {
      console.error(
        "❌ UPDATE MEDIA ERROR:",
        error
      );

      /*
        Agar update fail hua aur new file upload
        ho chuki hai, new file cleanup karo.
      */

      if (req.file) {
        try {
          const uploadedPath =
            path.join(
              __dirname,
              "../../public/uploads/media",
              req.file.filename
            );

          if (
            fs.existsSync(
              uploadedPath
            )
          ) {
            fs.unlinkSync(
              uploadedPath
            );
          }
        } catch (cleanupError) {
          console.error(
            "❌ Update cleanup error:",
            cleanupError.message
          );
        }
      }

      res.status(500).json({
        success: false,
        message:
          error.message ||
          "Media update nahi ho paya.",
      });
    }
  }
);

/* =========================================================
   DELETE MEDIA
========================================================= */

router.delete(
  "/:id",
  async (req, res) => {
    try {
      const media =
        await Media.findById(
          req.params.id
        );

      if (!media) {
        return res.status(404).json({
          success: false,
          message:
            "Media nahi mila.",
        });
      }

      /* -----------------------------------------
         DELETE PHYSICAL FILE
      ----------------------------------------- */

      if (media.filePath) {
        deleteMediaFile(
          media.filePath
        );
      } else if (media.url) {
        deleteMediaFile(
          media.url
        );
      }

      /* -----------------------------------------
         DELETE DATABASE RECORD
      ----------------------------------------- */

      await Media.findByIdAndDelete(
        req.params.id
      );

      console.log(
        "✅ Media deleted:",
        req.params.id
      );

      res.json({
        success: true,
        message:
          "Media deleted successfully",
      });
    } catch (error) {
      console.error(
        "❌ DELETE MEDIA ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          error.message ||
          "Media delete nahi ho paya.",
      });
    }
  }
);

module.exports = router;