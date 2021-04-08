import { Aggregation, TimestampRange } from "redis-time-series-ts";
import { generalRedisClient } from "../pubsub";
import { redisTSClient } from "../Redis/redis_client";
import { convertTimeUnitToMS } from "../Utils/round_up_time";

const analyze = async () => {
  const fromDateString = await generalRedisClient.get(
    "mem-usage:used:adaptive-average:from-date"
  );
  let fromDate: number = 0;
  let toDate: number = 0;
  const toDateString = await generalRedisClient.get(
    "mem-usage:used:adaptive-average:to-date"
  );
  if (!fromDateString || !toDateString) {
  } else {
    fromDate = parseInt(fromDateString);
    toDate = parseInt(toDateString);
  }
  const movingMetric: boolean = fromDate - toDate > 7.884e9;
  const memTSInfo = await redisTSClient.info("mem-usage:used:medium");
  const newFromDate = memTSInfo.lastTimestamp;
  for (let i = 1; i <= 168; i++) {
    const currentHour = toDate + i * convertTimeUnitToMS("h");
    const nextHour = toDate + (i + 1) * convertTimeUnitToMS("h");
    const sampleAVG = await redisTSClient.range(
      "mem-usage:used:medium",
      new TimestampRange(currentHour, toDate + nextHour),
      undefined,
      new Aggregation("avg", convertTimeUnitToMS("h"))
    )?.[0];
    const adaptiveAVG = await redisTSClient.range(
      "mem-usage:used:adaptive-average",
      new TimestampRange(toDate, toDate + i * convertTimeUnitToMS("h")),
      undefined,
      new Aggregation("avg", convertTimeUnitToMS("h"))
    )?.[0];
  }
};
