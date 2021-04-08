import {
  Aggregation,
  AggregationType,
  Label,
  RedisTimeSeriesFactory,
} from "redis-time-series-ts";
import { RedisTimeSeries } from "redis-time-series-ts/lib/redisTimeSeries";

const createTimeSeriesRule = async (
  client: RedisTimeSeries,
  srcKey: string,
  dstKey: string,
  timeBucket: number,
  aggregationType: AggregationType
) => {
  await client.createRule(
    srcKey,
    dstKey,
    new Aggregation(aggregationType, timeBucket)
  );
};

const compactForAll = async () => {
  const factory = new RedisTimeSeriesFactory();
  const client = factory.create();
  const metrics = [
    "cpu-usage",
    "mem-usage",
    "disk-usage",
    "disk-usage",
    "traffic",
  ];
  const components = ["current-load", "used", "read", "write", "all"];
  const periods = ["runtime", "short", "medium", "long"];

  // 1 min - 10 mins - 1hr
  const timeBuckets = [60000, 600000, 3600000];
  const metric = metrics[4];
  const component = components[4];
  for (let j = 1; j < periods.length; j++) {
    const srcPeriod = "runtime";
    const dstPeriod = periods[j];
    const srcKey = `${metric}:${component}:${srcPeriod}`;
    const dstKey = `${metric}:${component}:${dstPeriod}`;

    await createTimeSeriesRule(
      client,
      srcKey,
      dstKey,
      timeBuckets[j - 1],
      AggregationType.SUM
    );
  }
  // for (let i = 0; i < metrics.length; i++) {
  //   const metric = metrics[i];
  //   const component = components[i];
  //   for (let j = 1; j < periods.length; j++) {
  //     const srcPeriod = "runtime";
  //     const dstPeriod = periods[j];
  //     const srcKey = `${metric}:${component}:${srcPeriod}`;
  //     const dstKey = `${metric}:${component}:${dstPeriod}`;

  //     await createTimeSeriesRule(client, srcKey, dstKey, timeBuckets[j - 1],AggregationType.AVG);
  //   }
  // }
  console.log("Finished creating rules");

  client.disconnect();
};
compactForAll();
