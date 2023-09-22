import handleCompress from "../util/handleCompress.js";
import { Server } from "../server.js";

const startApiService = async (server: Server) => {
  server.post(
    "/compress/image",
    {
      bodyLimit: 1048576, // 1MB
    },
    handleCompress
  );

  server.post(
    "/compress/video",
    {
      bodyLimit: 104857600000, // 100MB
    },
    handleCompress
  );

  server.get("/", (req, res) => res.send("hello"));
};

export default startApiService;
