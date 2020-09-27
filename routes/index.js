const express = require("express");
const router = express.Router();
const multer = require("multer");
const multerS3 = require("multer-s3");
const aws = require("aws-sdk");
const dayjs = require("dayjs");

const s3 = new aws.S3({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.BUCKET_NAME,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    acl: "public-read",
    key: function (req, file, cb) {
      const temp = file.originalname.split(".");
      const extension = temp[temp.length - 1];
      cb(null, `${dayjs().format("MM-DD-YYYY-hh:mm")}.${extension}`);
    },
  }),
});

router.get("/", function (req, res, next) {
  res.render("index", { title: "Working prototype" });
});

router.post("/upload", upload.single("photos"), function (req, res, next) {
  const { originalname, mimetype, size, key } = req.file;

  s3.deleteObject(
    {
      Key: key,
      Bucket: process.env.BUCKET_NAME,
    },
    function (err, data) {
      if (err) {
        res.send({
          error: "Something went wrong",
        });
      } else {
        res.send({
          size,
          name: originalname,
          type: mimetype,
        });
      }
    }
  );
});

module.exports = router;
