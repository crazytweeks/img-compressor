import { MultipartFile } from "@fastify/multipart";
import { FastifyReply, FastifyRequest } from "fastify";
import fs from "fs";

import ffmpeg from "fluent-ffmpeg";

const tempPath = `./media/`;

interface VideoCompressionOptions {
  allThreads?: boolean;
  fps?: number;
  toFormat?: string;
  quality?: number;
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

      ffmpegCommand
        .addOptions([
          `-threads ${compressionOptions?.allThreads ? "0" : "1"}`, // Multithreading
          "-preset ultrafast", // Preset for speed
          "-crf 28", // Constant Rate Factor (0-51) 0 is lossless, 51 is worst quality
          "-profile:v baseline", // Profile for older devices
          "-level 3.0", // Level for older devices
          "-movflags faststart", // Fast start for streaming
          "-pix_fmt yuv420p", // Pixel format
        ])
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
  const tempFilePath = await dumpVideoToTempDisk(media);

  const compressedFilePath = (
    await compressAndReturnPath(tempFilePath, compressionOptions)
  ).slice(1);

  const reqUrl = req.url;
  const reqHost = req.headers.host;
  const protocol = req.protocol;

  const compressedFileUrl = `${protocol}://${reqHost}${compressedFilePath}`;
  console.log("compressedFileUrl: ", compressedFileUrl);

  res.header("Content-Type", "json/application");

  res.send({
    compressedFileUrl,
    reqUrl,
    reqHost,
    compressedFilePath,
  });

  return compressedFilePath;
};

export default compressVideoAndReturn;
export type { VideoCompressionOptions };
