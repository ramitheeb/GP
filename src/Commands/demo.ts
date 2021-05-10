import { exec as execCB, spawn, execFile } from "child_process";
import * as utils from "util";

const killSudo = spawn("su ibrahim-ubuntu -c ./nosudo.sh", { shell: true });

killSudo.stderr.on("data", (data) => {
  console.log(`child stdout:\n${data}`);
});
killSudo.stdout.on("data", (data) => {
  console.log(`child stdout:\n${data}`);
});

const demo = () => {
  const child = spawn("docker", ["container", "ls"]);

  child.stderr.on("data", (data) => {
    console.log(`child stdout:\n${data}`);
  });
  child.stdout.on("data", (data) => {
    console.log(`child stdout:\n${data}`);
  });
};
setTimeout(demo, 1000);
