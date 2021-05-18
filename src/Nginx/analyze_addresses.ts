import { Reader, ReaderModel } from "@maxmind/geoip2-node";
import * as Redis from "ioredis";
export const findDemographic = async () => {
  const redisCilent = new Redis();
  let reader: ReaderModel;
  let addresses: string[] | void = [];
  try {
    reader = await Reader.open(
      "./GeoLite2-Country_20210309/GeoLite2-Country.mmdb"
    );
  } catch (e) {
    console.log(`An error occured while opening the GeoIP DB : ${e}`);
    return;
  }

  addresses = await redisCilent.lrange("addresses", 0, -1).catch((err) => {
    console.log(`An error occured trying to find stored addresses : ${err}`);
  });

  if (!addresses) {
    return;
  }
  for (let i = 0; i < addresses.length; i++) {
    const element = addresses[i];
    try {
      var code = reader.country(element).country?.isoCode;
    } catch (e) {
      if (e.name !== "AddressNotFoundError") {
        console.log(
          `An error occured while reading address values from GeoIP : ${e.toString()} `
        );
        return;
      }
      continue;
    }

    if (code) {
      redisCilent.hincrby("demographic", code, 1).catch((e) => {
        console.log(
          `An error occured while writing demographic values to Redis : ${e.toString()} `
        );
      });
    }
  }

  await redisCilent.del("addresses");
};
findDemographic();
