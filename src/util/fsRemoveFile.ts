import fs from "fs";

const fsRemoveFile = (path: string): Promise<boolean> => {
  return new Promise<boolean>((resolve, reject) => {
    try {
      fs.unlinkSync(path);
      resolve(true);
    } catch (err) {
      reject(err);
    }
  });
};

export default fsRemoveFile;
