import { FastifyRequest, RouteHandlerMethod } from "fastify";

import { CompressionOptions, compressImageAndReturn } from "./compressImage.js";
import compressVideoAndReturn from "./compressVideo.js";
import type { VideoCompressionOptions } from "./compressVideo.js";

const createCompressionProps = (req: FastifyRequest) => {
  var props = {
    resize: {},
    blur: false,
    toFormat: "jpeg",
    quality: 80,

    watermark: undefined,
    // watermarkPosition: undefined,
  } as CompressionOptions;

  const query: CompressionOptions = JSON.parse(
    JSON.stringify(req.query as unknown as string)
  );

  if (query.resize) props.resize = query.resize;

  if (query.blur) props.blur = parseInt(query.blur as unknown as string);

  if (query.toFormat) props.toFormat = query.toFormat;

  if (query.quality)
    props.quality = parseInt(query.quality as unknown as string);

  if (query.watermark) props.watermark = query.watermark;

  // if (query.watermark && query.watermarkPosition)
  //   props.watermarkPosition = query.watermarkPosition;

  return props;
};

const createVideoCompressionProps = (req: FastifyRequest) => {
  var props = {
    fps: 24,
    toFormat: "mp4",
    allThreads: false,
  } as VideoCompressionOptions;

  const query: VideoCompressionOptions = JSON.parse(
    JSON.stringify(req.query as unknown as string)
  );

  console.log("query.allThreads: ", query.allThreads);
  if (query.fps) props.fps = parseInt(query.fps as unknown as string);
  if (query.toFormat) props.toFormat = query.toFormat;
  if (query.allThreads) props.allThreads = query.allThreads === true;
  if (query.quality) props.quality = query.quality;

  return props;
};

const handleCompress: RouteHandlerMethod = async (req, res) => {
  const file = await req.file();

  if (!file) {
    res.status(400);
    return { error: "Invalid file" };
  }

  if (file.mimetype.startsWith("image/"))
    return compressImageAndReturn(file, createCompressionProps(req), req, res);

  if (file.mimetype.startsWith("video/"))
    return compressVideoAndReturn(
      file,
      createVideoCompressionProps(req),
      req,
      res
    );

  res.status(400);
  return { error: "Invalid file" };
};

export default handleCompress;
