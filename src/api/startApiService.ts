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
};

export default startApiService;
