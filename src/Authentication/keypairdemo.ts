import {
  createCipheriv,
  createPrivateKey,
  createPublicKey,
  createSign,
  createVerify,
  generateKeyPairSync,
  privateEncrypt,
} from "crypto";
import * as utils from "util";
import { readFileSync } from "fs";
// import * as atob from "atob";
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
// const publicKey = createPublicKey(
//   readFileSync(
//     "/home/ibrahim-ubuntu/Documents/GP/ServerMonitor/keys/admin-pub-key.pem"
//   )
// );
// const c = privateEncrypt(
//   privateKey,
//   Buffer.from(
//     "090f75e219e5beb9aea8b62ad375ce0c00fe736279b4ba4cb77b99ebd5681004dff6395631663ea4e4efddcf6dbe6483b6bd37e8feacafb04714daacc1c5164e",
//     "hex"
//   )
// );
const sign = createSign("SHA256");
sign.update("some data to sign");
sign.end();
const signature = sign.sign(privateKey);
console.log(signature.toString("hex"));

// const verify = createVerify("SHA256");
// verify.update("some data to sign");
// verify.end();
// console.log(verify.verify(publicKey, signature));
// fetch the part of the PEM string between header and footer
const pem = "";
const pemHeader = "-----BEGIN PRIVATE KEY-----";
const pemFooter = "-----END PRIVATE KEY-----";
const pemContents = pem.substring(
  pemHeader.length,
  pem.length - (pemFooter.length + 1)
);

// base64 decode the string to get the binary data
// const binaryDerString = atob(pemContents);
// console.log(binaryDerString);

// const sign = createSign("SHA256");
// sign.update(
//   Buffer.from(
//     "dce2469fb2c615c463f0526865715382c0fa497535843322bf3c16ba0d4a4bfa5beb43a2af8eaf4ea04ccf0208e4b29dc230055d460d40af4f5fb931f77b7e47",
//     "hex"
//   )
// );
// sign.end();
// const signature = sign.sign(privateKey);
// console.log(signature.toString("hex"));
// const verify = createVerify("SHA256");
// verify.update(
//   Buffer.from(
//     "d959c50adb434d6ca733fac04d3065c3b5593b22f7a1738eab3464d3a8bdf431380124b851532b1aac909ffda1af0f9dc3d96578daf122004892197e575e4f9e",
//     "hex"
//   )
// );
// verify.end();
// console.log(verify.verify(publicKey, signature));
