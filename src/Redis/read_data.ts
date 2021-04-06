import {
  Aggregation,
  RedisTimeSeriesFactory,
  TimestampRange,
} from "redis-time-series-ts";
import { RedisTimeSeries } from "redis-time-series-ts/lib/redisTimeSeries";

const readData = async (
  client: RedisTimeSeries,
  key: string,
  fromTimestamp: number,
  toTimestamp: number
) => {
  const samples = await client.range(
    key,
    new TimestampRange(fromTimestamp, toTimestamp),
    15,
    new Aggregation("AVG", 86400000)
  );
  // for (const sample in samples) {
  //    console.log();

  // }
  for (let i = 0; i < samples.length; i++) {
    //  console.log(samples[i]);
  }
};

const f = async () => {
  const factory = new RedisTimeSeriesFactory();
  const client = factory.create();
  const fromTimestamp = 1582903129000;
  const toTimeStamp = 1614439129000;
  const key = "cpu-usage";
  readData(client, key, fromTimestamp, toTimeStamp);
  client.disconnect();
};
f();
