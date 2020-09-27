const gulp = require("gulp");
const eb = require("gulp-beanstalk-deploy");
const Sequence = require("sequence").Sequence;
const fs = require("fs");

const filename = "archive.zip";

gulp.task("deploy", function (cb) {
  Sequence.create()
    .then((next) => {
      if (fs.existsSync(filename)) {
        console.log("removing zip");

        try {
          fs.unlinkSync(filename);
          next();
        } catch (err) {
          console.error(err);
        }
      } else {
        next();
      }
    })
    .then((next) => {
      console.log("creating new zip");
      next();
    })
    .then((next) => {
      console.log("deploying app");
      cb();

      const {
        AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY,
        AWS_REGION,
        APPLICATION_NAME,
        APPLICATION_ENVIRONMENT_NAME,
        AWS_S3_BUCKET,
      } = process.env;

      eb(
        {
          accessKeyId: AWS_ACCESS_KEY_ID,
          secretAccessKey: AWS_SECRET_ACCESS_KEY,
          region: AWS_REGION,
          applicationName: APPLICATION_NAME,
          environmentName: APPLICATION_ENVIRONMENT_NAME,
          versionLabel: "0.0.1",
          sourceBundle: filename,
          s3Bucket: {
            bucket: AWS_S3_BUCKET,
          },
          tagsToAdd: [],
          tagsToRemove: [],
          waitForDeploy: true,
        },
        cb
      );
    });
});
