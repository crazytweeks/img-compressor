import { handleCompress } from "../util/handleCompress";
import { Server } from "../server";

const startApiService = async (server: Server) => {
  server.post(
    "/compress/image",
    {
      bodyLimit: 1048576, // 1MB
    },
    handleCompress
  );
};

export { startApiService };
