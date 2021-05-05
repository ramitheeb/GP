import {
  createPrivateKey,
  createPublicKey,
  createSign,
  createVerify,
  generateKeyPairSync,
} from "crypto";
import * as utils from "util";
import { readFileSync } from "fs";

// const { privateKey, publicKey } = generateKeyPairSync("rsa", {
//   modulusLength: 2048,
// });
// console.log(
//   publicKey
//     .export({
//       format: "pem",
//       type: "spki",
//     })
//     .toString()
// );

// const key = readFileSync("./test-key-pub.pem");
// // console.log(key);

const privateKey = createPrivateKey(
  readFileSync("/home/ibrahim-ubuntu/Documents/GP/ServerMonitor/keys/admin-key")
);
const publicKey = createPublicKey(
  readFileSync(
    "/home/ibrahim-ubuntu/Documents/GP/ServerMonitor/keys/admin-pub-key.pem"
  )
);

// const sign = createSign("SHA256");
// sign.update("some data to sign");
// sign.end();
// const signature = sign.sign(privateKey);

// const verify = createVerify("SHA256");
// verify.update("some data to sign");
// verify.end();
// console.log(verify.verify(publicKey, signature));
const sign = createSign("SHA256");
sign.update(
  Buffer.from(
    "5242636028c3562503c0fdebeda994190bce3538900a6dc33887b475181dc7aa5bea2609ae6a0ef65e87d37fca6130636dc0c90f50d8de07cfd188c5c3eb703a",
    "hex"
  )
);
sign.end();
const signature = sign.sign(privateKey);
console.log(signature.toString("hex"));
// const verify = createVerify("SHA256");
// verify.update(
//   Buffer.from(
//     "d959c50adb434d6ca733fac04d3065c3b5593b22f7a1738eab3464d3a8bdf431380124b851532b1aac909ffda1af0f9dc3d96578daf122004892197e575e4f9e",
//     "hex"
//   )
// );
// verify.end();
// console.log(verify.verify(publicKey, signature));
