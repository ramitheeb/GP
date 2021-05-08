import * as fs from "fs";
import * as faker from "faker";
import moment = require("moment");
const endpoints: string[] = [
  "/",
  "/static/css/blog.css",
  "/static/css/home_master.css",
  "/static/JavaScript/home_master.js",
  "/static/books.jpg",
  "/static/mexican-hat.png",
  "/account/login/",
  "/posts/",
  "/alexanne/",
  "/blog/",
  "/dameon/",
  "/ova.css",
  "/heidi/",
  "/marshal/",
  "/rey/",
  "/let.png",
  "/memories/ofit.jpg",
];
const fileData = fs.readFileSync("temp.log");
let output: string = "";
const lines = fileData.toString().split(/\n/);
for (let i = 0; i < lines.length; i++) {
  const element = lines[i];
  const elementDate = element.match(/^.*(?=;traffic)/)?.[0];
  const elementValue = element.match(/(?<=traffic;).*$/)?.[0];
  const sampleDate = new Date(elementDate ? elementDate : "");
  const numberOfRecords = parseInt(elementValue ? elementValue : "0");
  let timeSum: number = 0;
  const timeDivisionPeriod: number = 3.6e6 / numberOfRecords;
  for (let j = 0; j < numberOfRecords; j++) {
    timeSum += Math.floor(Math.random() * timeDivisionPeriod);
    const address = faker.internet.ip();
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const time = moment(sampleDate.getTime() + timeSum);
    output += `${address} \"${endpoint}\" [${time.toISOString(true)}]\n`;
    // console.log(`${address} \"${endpoint}\" [${time.toISOString(true)}]`);
  }
}
fs.writeFileSync("newtemp", output, { flag: "a" });
console.log("Almost done");
