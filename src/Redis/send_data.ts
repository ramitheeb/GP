import { Sample, RedisTimeSeriesFactory } from "redis-time-series-ts";
import { RedisTimeSeries } from "redis-time-series-ts/lib/redisTimeSeries";
import * as si from "systeminformation";

var sampleRatePerDay = 2880;

const sendDate = async (client: RedisTimeSeries, key: string) => {
  for (let i = 0; i < 365; i++) {
    let samples: Sample[] = [];
    for (let j = 0; j < sampleRatePerDay; j++) {
      const sample = new Sample(
        key,
        Math.floor(Math.random() * 48000 + 2000),
        1582903129000 + 86400000 * i + Math.floor(Math.random() * 86400000)
      );
      samples.push(sample);
    }
    const multiget = await client.multiAdd(samples);
  }

  console.log(`Finished adding at ${key}`);
};

const f = async () => {
  const factory = new RedisTimeSeriesFactory();
  const client = factory.create();
  const metrics = ["cpu-usage", "mem-usage", "disk-usage", "disk-usage"];
  const components = ["current-load", "free", "read", "write"];
  for (let i = 0; i < metrics.length; i++) {
    const metric = metrics[i];
    const component = components[i];
    const period = "runtime";
    const key = `${metric}:${component}:${period}`;
    await sendDate(client, key);
  }
};
f();
