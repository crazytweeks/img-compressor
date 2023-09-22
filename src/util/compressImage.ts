import sharp, { type ResizeOptions } from "sharp";
import fs from "fs";

import type { MultipartFile } from "@fastify/multipart";
import { FastifyReply, FastifyRequest } from "fastify";
import fileSteamToBuffer from "./fileSteamToBuffer.js";

type CompressionOptions = {
  resize?: ResizeOptions;
  blur?: number | boolean;
  toFormat?: keyof sharp.FormatEnum;
  watermark?: string;
  quality?: number;
  // watermarkPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
};

// const getPosition = (position: CompressionOptions["watermarkPosition"]) => {
//   switch (position) {
//     case "top-left":
//       return { top: 10, left: 10 };
//     case "top-right":
//       return { left: 80, top: 10, right: 10 };
//     case "bottom-left":
//       return { bottom: 10, left: 10 };
//     case "bottom-right":
//       return { bottom: 10, right: 10 };
//     default:
//       return { top: 10, left: 10 };
//   }
// };

const compressImageAndReturn = async (
  media: MultipartFile,
  compressionOptions: CompressionOptions,
  req: FastifyRequest,
  res: FastifyReply
) => {
  const { mimetype, fieldname, file, filename, encoding, type } = media;

  const mediaBuffer = await fileSteamToBuffer(file as unknown as fs.ReadStream);

  const compressedImage = await sharp(mediaBuffer)
    .resize(compressionOptions.resize)
    .composite(
      compressionOptions.watermark
        ? [
            {
              input: {
                text: {
                  text: compressionOptions.watermark,
                  dpi: 300,
                  align: "left",
                },
              },
              // ...getPosition(compressionOptions.watermarkPosition),
              top: 10,
              left: 10,
            },
          ]
        : []
    )
    .blur(compressionOptions.blur ?? false)
    .jpeg({
      quality: compressionOptions.quality ? compressionOptions.quality : 80,
    })
    .toFormat(
      compressionOptions.toFormat ? compressionOptions.toFormat : "webp"
    )
    .toBuffer();

  const compressedImageSize = compressedImage.length;
  const originalImageSize = mediaBuffer.length;

  const compressionRatio = Math.round(
    (originalImageSize / compressedImageSize) * 100
  );

  res.header("Content-Type", mimetype);
  res.header("Content-Length", compressedImageSize.toString());
  res.header("Content-Disposition", `attachment; filename=${filename}`);
  res.header("X-Compression-Ratio", compressionRatio.toString());

  res.header("X-Original-Image-Size", originalImageSize.toString());
  res.header("X-Compressed-Image-Size", compressedImageSize.toString());

  return compressedImage;
};

export type { CompressionOptions };
export { compressImageAndReturn };
