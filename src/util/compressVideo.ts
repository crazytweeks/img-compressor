import { MultipartFile } from "@fastify/multipart";
import { CompressionOptions } from "./compressImage.js";
import { FastifyReply, FastifyRequest } from "fastify";
import fs from "fs";

import ffmpeg from "fluent-ffmpeg";

const tempPath = `./media/`;

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

const compressAndReturnPath = async (tempPath: string) => {
  return new Promise<string>(async (resolve, reject) => {
    try {
      const ffmpegCommand = ffmpeg(tempPath);

      const filePath = `${tempPath}_compressed.mp4`;

      ffmpegCommand

        .addOptions([
          "-threads 1",
          "-preset ultrafast",
          "-crf 28",
          "-profile:v baseline",
          "-level 3.0",
          "-movflags faststart",
          "-pix_fmt yuv420p",
        ])
        .FPS(24)
        .toFormat("mp4")
        .audioQuality(0)
        .videoBitrate(`0k`)
        .autopad()
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
  compressionOptions: CompressionOptions,
  req: FastifyRequest,
  res: FastifyReply
) => {
  const tempFilePath = await dumpVideoToTempDisk(media);

  const compressedFilePath = (await compressAndReturnPath(tempFilePath)).slice(
    1
  );

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
