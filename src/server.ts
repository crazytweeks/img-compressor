import Fastify from "fastify";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import path from "node:path";

const server = Fastify({
  logger: false,
});

server.register(multipart, {
  limits: {
    fileSize: 2500 * 1024 * 1024, //  2.5GB
    files: 1,
  },
});

const root = path.join(path.resolve(), "media");

server.register(fastifyStatic, {
  root: root,
  prefix: "/media", // optional: default '/'
  constraints: {}, // optional: default {}
});

type Server = typeof server;

export { server };
export type { Server };
