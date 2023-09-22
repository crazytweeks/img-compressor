import { MultipartFile } from "@fastify/multipart";
import { FastifyReply, FastifyRequest } from "fastify";
import fs from "fs";

import ffmpeg from "fluent-ffmpeg";
import fsRemoveFile from "./fsRemoveFile.js";

const tempPath = `./media/`;

interface VideoCompressionOptions {
  allThreads?: boolean;
  fps?: number;
  toFormat?: string;
  quality?: number;
  speed?: number;
}

const dumpVideoToTempDisk = async (media: MultipartFile) => {
  return new Promise<string>((resolve, reject) => {
    const { mimetype, fieldname, file, filename, encoding, type } = media;

    if (!fs.existsSync(tempPath)) {
      fs.mkdirSync(tempPath);
    }

    const tempFilePath = `./media/${filename}`;

    const writeStream = fs.createWriteStream(tempFilePath);
    file.pipe(writeStream);

    writeStream.on("finish", () => {
      resolve(tempFilePath);
    });

    writeStream.on("error", (err) => {
      console.log("error");
      reject(err);
    });
  });
};

const compressAndReturnPath = async (
  tempPath: string,
  compressionOptions?: VideoCompressionOptions
) => {
  return new Promise<string>(async (resolve, reject) => {
    try {
      const ffmpegCommand = ffmpeg(tempPath);

      const fileExtention = tempPath.split(".").pop();

      const filePath = `${tempPath}_compressed.${
        compressionOptions?.toFormat ? compressionOptions.toFormat : "mp4"
      }`.replace(`.${fileExtention}`, "");

      const options = [
        `-threads ${compressionOptions?.allThreads ? "0" : "1"}`, // Multithreading
        "-profile:v baseline", // Profile for older devices
        "-level 3.0", // Level for older devices
        "-movflags faststart", // Fast start for streaming
        "-pix_fmt yuv420p", // Pixel format
        "-vcoder libx264", // Video Codec
      ];

      if (compressionOptions?.speed) {
        options.push(
          `-speed ${
            compressionOptions.speed > 8
              ? 8
              : compressionOptions.speed < 0
              ? 0
              : compressionOptions.speed
          }`
        );

        options.push(
          `-crf ${
            compressionOptions.speed > 51
              ? 51
              : compressionOptions.speed < 0
              ? 0
              : compressionOptions.speed * 5
          }`
        );
      } else {
        options.push("-preset podcast");
        options.push("-crf 28");
      }

      ffmpegCommand
        .addOptions(options)
        .FPS(compressionOptions?.fps ? compressionOptions.fps : 24)
        .toFormat(
          compressionOptions?.toFormat ? compressionOptions.toFormat : "mp4"
        )
        .audioQuality(0)
        .videoBitrate(`0k`)
        .autopad()
        .size(
          compressionOptions?.quality
            ? `${
                compressionOptions.quality >= 100
                  ? 100
                  : compressionOptions.quality
              }%`
            : "80%"
        )
        .on("progress", function (progress) {
          console.log("progress: ", progress.percent);
        })
        .on("error", (err) => {
          console.log("An error occurred: " + err.message);
          reject(err);
        })
        .on("end", () => {
          console.log("Processing finished !");
          resolve(filePath);
        })
        .save(filePath);
    } catch (err) {
      console.log("err", err);
      reject(err);
    }
  });
};

const compressVideoAndReturn = async (
  media: MultipartFile,
  compressionOptions: VideoCompressionOptions,
  req: FastifyRequest,
  res: FastifyReply
) => {
  try {
    const timeStart = Date.now();
    const tempFilePath = await dumpVideoToTempDisk(media);

    const compressedFilePath = (
      await compressAndReturnPath(tempFilePath, compressionOptions)
    ).slice(1);

    const reqUrl = req.url;
    const reqHost = req.headers.host;
    const protocol = req.protocol;

    const compressedFileUrl = `${protocol}://${reqHost}${compressedFilePath}`;

    res.header("Content-Type", "json/application");

    const fileSize = fs.statSync(`.${compressedFilePath}`).size;
    const fileSizeInMB = fileSize / 1000000.0;

    const originalFileSize = fs.statSync(tempFilePath).size;
    const originalFileSizeInMB = originalFileSize / 1000000.0;

    fsRemoveFile(tempFilePath);

    const timeEnd = Date.now();

    const data = {
      compressedFileUrl,
      reqUrl,
      reqHost,
      compressedFilePath,
      size: {
        fileSize,
        fileSizeInMB,

        originalFileSize,
        originalFileSizeInMB,
      },

      time: {
        timeStart,
        timeEnd,
        timeTaken: timeEnd - timeStart,
        timeTakenInSeconds: (timeEnd - timeStart) / 1000,
      },
    };

    res.send(data);

    return compressedFilePath;
  } catch (err) {
    console.log("err", err);
    return err;
  }
};

export default compressVideoAndReturn;
export type { VideoCompressionOptions };
