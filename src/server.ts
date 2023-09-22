import Fastify from "fastify";
import multipart from "@fastify/multipart";

const server = Fastify({
  logger: false,
});

server.register(multipart, {
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
    files: 1,
  },
});

type Server = typeof server;

export { server };
export type { Server };
