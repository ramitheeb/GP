import * as fs from "fs";
const ISO3166jsonFileString = fs.readFileSync("all.json").toString();
const ISO3166Object = JSON.parse(ISO3166jsonFileString);

let topojsonFileString = fs.readFileSync("world-countries.json").toString();

console.log("Finished Reading files, starting to convert");

for (const key in ISO3166Object) {
  const element = ISO3166Object[key];
  const alpha2Code = element["alpha-2"];
  const alpha3Code = element["alpha-3"];
  const temp = topojsonFileString.replace(alpha3Code, alpha2Code);
  if (topojsonFileString.localeCompare(temp) == 0) {
    console.log(`${alpha3Code} doesn't exist in the topo file`);
  }
  topojsonFileString = temp;
}
// fs.writeFileSync("world-topo.json", topojsonFileString);
console.log("Finihsed converting and writing to file");
