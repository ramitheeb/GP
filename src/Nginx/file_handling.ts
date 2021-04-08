import { promises as fsp, createReadStream } from "fs";
import * as rl from "readline";
const demo = async () => {
  const fileStream = createReadStream("file_handling_demo.log");
  const lineReader = rl.createInterface({
    input: fileStream,
  });
  lineReader.on("line", (line) => {
    console.log(line);
  });
  // try {
  //   await fsp.open("file_handling_demo.log", "r");
  // } catch (e) {
  //   console.log(e);
  // }
  // console.log("opened the file");
};
demo();
