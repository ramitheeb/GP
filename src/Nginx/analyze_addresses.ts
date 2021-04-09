import { Reader, ReaderModel } from "@maxmind/geoip2-node";
import { generalRedisClient } from "../pubsub";

const findDemograhpic = async () => {
  let reader: ReaderModel;
  let addresses: string[] = [];
  try {
    reader = await Reader.open(
      "GeoLite2-Country_20210309/GeoLite2-Country.mmdb"
    );
  } catch (e) {
    console.log(`An error occured while opening the GeoIP DB : ${e}`);
    return;
  }
  try {
    addresses = await generalRedisClient.lrange("addresses", 0, -1);
  } catch (e) {
    console.log(
      `An error occured while reading address values from Redis : ${e}`
    );
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
      generalRedisClient.hincrby("demographic", code, 1).catch((e) => {
        console.log(
          `An error occured while writing demographic values to Redis : ${e.toString()} `
        );
      });
    }
  }
  console.log("Finished analyzing addresses");
  generalRedisClient.del("addresses");
};
findDemograhpic();
