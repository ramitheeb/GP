import { Reader } from "@maxmind/geoip2-node";
import { read } from "fs";
Reader.open("GeoLite2-Country_20210309/GeoLite2-Country.mmdb")
  .then((reader) => {
    console.log("Opened succefully");
    console.log(reader.country("46.43.111.116"));
  })
  .catch((e) => {
    console.log("error : ", e);
  });
// const demo = async () => {
//   const reader = await Reader.open(
//     "GeoLite2-Country_20210309/GeoLite2-Country.mmdb"
//   );
//   reader.country("46.43.111.116");
//   console.log();
// };
// demo();
