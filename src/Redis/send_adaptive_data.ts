import { Sample } from "redis-time-series-ts";
import { convertTimeUnitToMS } from "../Utils/round_up_time";
import { redisTSClient } from "./redis_client";

const sendDataToAdaptiveTS = async () => {
  for (let i = 0; i < 2016; i++) {
    const sample = new Sample(
      "mem-usage:used:adaptive-average",
      Math.floor(Math.random() * 48000 + 2000),
      i * convertTimeUnitToMS("h")
    );
    await redisTSClient.add(sample);
  }
  console.log("Finished adding");
};
sendDataToAdaptiveTS();
