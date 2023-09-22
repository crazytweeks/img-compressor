import fs from "fs";

const fileSteamToBuffer = (file: fs.ReadStream) => {
  const chunks: Buffer[] = [];
  return new Promise<Buffer>((resolve, reject) => {
    file.on("data", (chunk: Buffer) => chunks.push(chunk));
    file.on("error", (err) => reject(err));
    file.on("end", () => resolve(Buffer.concat(chunks)));
  });
};

export default fileSteamToBuffer;
