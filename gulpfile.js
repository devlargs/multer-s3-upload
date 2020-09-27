const gulp = require("gulp");
const eb = require("gulp-beanstalk-deploy");
const Sequence = require("sequence").Sequence;
const fs = require("fs");
const archiver = require("archiver");

const filename = "archive.zip";

gulp.task("deploy", function (cb) {
  Sequence.create()
    .then((next) => {
      if (fs.existsSync(filename)) {
        try {
          console.log("Removing ZIP file");
          fs.unlinkSync(filename);
          next();
        } catch (err) {
          console.error(err);
        }
      } else {
        next();
      }
    })
    .then(async (next) => {
      const archive = archiver("zip");
      const stream = fs.createWriteStream(filename);
      console.log("Compressing the application");

      const bool = await new Promise((resolve, reject) => {
        archive
          .directory("./", false)
          .on("error", (err) => reject(err))
          .pipe(stream);

        stream.on("close", () => resolve(true));
        archive.finalize();
      });

      if (bool) {
        console.log("Successfully compressed app");
        next();
      } else {
        console.log("An error occurred while compressing the app");
      }
    })
    .then(() => {
      console.log("Deploying app to elastic beanstalk");
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
