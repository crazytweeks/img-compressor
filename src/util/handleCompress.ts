import { FastifyRequest, RouteHandlerMethod } from "fastify";

import { CompressionOptions, compressImageAndReturn } from "./compressImage.js";

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

const handleCompress: RouteHandlerMethod = async (req, res) => {
  const file = await req.file();

  if (!file) {
    res.status(400);
    return { error: "Invalid file" };
  }

  if (file.mimetype.startsWith("image/"))
    return compressImageAndReturn(file, createCompressionProps(req), res);

  res.status(400);
  return { error: "Invalid file" };
};

export default handleCompress;
