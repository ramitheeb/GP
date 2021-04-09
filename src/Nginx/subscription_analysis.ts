// import { promises as fsp, createReadStream, watch } from "fs";
import { createReadStream, createWriteStream, watchFile } from "fs";
import * as rl from "readline";

const demo = async () => {
  //   const ac = new AbortController();
  //   const { signal } = ac;
  // const watcher = watch("test.txt");
  // watcher.on("change", (event, filename) => {
  //   console.log(event);
  // });
  try {
    watchFile("test.txt", (curr, prev) => {
      console.log(curr);
      console.log(prev);
    });
  } catch (e) {
    console.log(e);
  }
  // const fileStream = createReadStream("test.txt", {});
  // createWriteStream("", {});
  // const lineReader = rl.createInterface({
  //   input: fileStream,
  // });
  // lineReader.on("line", (line) => {
  //   console.log("got a line");
  //   lineReader.pause();
  // });
  // lineReader.on("close", () => {
  //   console.log("file closed");
  // });
};
demo();
