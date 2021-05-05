import { exec as execCB, spawn } from "child_process";
import * as utils from "util";
const exec = utils.promisify(execCB);

const test = async () => {
  const x = await exec("../scripts/testSudo.sh").catch((err) => {
    console.log(typeof err);
  });
  if (!x) return;
  console.log(`Output is : ${x.stdout}`);
  console.log(`Errors are : ${x.stderr}`);
};
// process.kill(164);
test();
