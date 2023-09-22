import startApiService from "./api/startApiService.js";
import { server } from "./server.js";

const SERVER_PORT = 8080;

const startServer = async () => {
  try {
    server.listen({ port: SERVER_PORT, host: "127.0.0.1", backlog: 511 });

    const address = server.server.address();
    const url =
      typeof address === "string" ? address : `http://localhost:${SERVER_PORT}`;

    console.info(`Server listening on ${url}`);

    startApiService(server);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

startServer();
