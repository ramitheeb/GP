import { Sample, RedisTimeSeriesFactory } from "redis-time-series-ts";
import { RedisTimeSeries } from "redis-time-series-ts/lib/redisTimeSeries";
import * as si from "systeminformation";

const sampleRatePerDay = 2880;

const sendData = async (client: RedisTimeSeries, key: string) => {
  for (let i = 0; i < 365; i++) {
    let samples: Sample[] = [];
    for (let j = 0; j < sampleRatePerDay; j++) {
      const sample = new Sample(
        key,
        Math.floor(Math.random() * 48000 + 2000),
        1583826179000 + 86400000 * i + Math.floor(Math.random() * 86400000)
      );
      samples.push(sample);
    }
    const multiget = await client.multiAdd(samples);
  }

  //Sending data of the past week
  /* for (let i = 0; i < 7; i++) {
    let samples: Sample[] = [];
    for (let j = 0; j < sampleRatePerDay; j++) {
      const sample = new Sample(
        key,
        Math.floor(Math.random() * 48000 + 2000),
        1614634147000 + 86400000 * i + Math.floor(Math.random() * 86400000)
      );
      samples.push(sample);
    }
    const multiget = await client.multiAdd(samples);
  }*/

  console.log(`Finished adding at ${key}`);
};

const sendDataToDiskTS = async (
  client: RedisTimeSeries,
  readKey: string,
  writeKey: string
) => {
  for (let i = 0; i < 365; i++) {
    let readSamples: Sample[] = [];
    let writeSamples: Sample[] = [];

    for (let j = 0; j < sampleRatePerDay; j++) {
      const readValue = Math.floor(Math.random() * 2840);
      const writeValue = Math.floor(Math.random() * 2840);
      const timestamp =
        1583772196000 + 86400000 * i + Math.floor(Math.random() * 86400000);

      const readSample = new Sample(readKey, readValue, timestamp);
      const writeSample = new Sample(writeKey, writeValue, timestamp);

      readSamples.push(readSample);
      writeSamples.push(writeSample);
    }
    const multiReadAdd = await client.multiAdd(readSamples);
    const multiWriteAdd = await client.multiAdd(writeSamples);
  }

  console.log(`Finished adding at ${readKey} and ${writeKey}`);
};

const sendDataToTraffiTS = async (client: RedisTimeSeries, key: string) => {
  const sampleRatePerDay = 144;
  for (let i = 0; i < 365; i++) {
    let samples: Sample[] = [];
    for (let j = 0; j < sampleRatePerDay; j++) {
      const sample = new Sample(
        key,
        Math.floor(Math.random() * 6),
        1582830063000 + 86400000 * i + Math.floor(Math.random() * 86400000)
      );
      samples.push(sample);
    }
    const multiget = await client.multiAdd(samples);
  }

  //Sending data of the past week
  /* for (let i = 0; i < 7; i++) {
    let samples: Sample[] = [];
    for (let j = 0; j < sampleRatePerDay; j++) {
      const sample = new Sample(
        key,
        Math.floor(Math.random() * 48000 + 2000),
        1614634147000 + 86400000 * i + Math.floor(Math.random() * 86400000)
      );
      samples.push(sample);
    }
    const multiget = await client.multiAdd(samples);
  }*/

  console.log(`Finished adding at ${key}`);
};
const sendForAll = async () => {
  const factory = new RedisTimeSeriesFactory();
  const client = factory.create();
  const metrics = ["cpu-usage", "mem-usage", "disk-usage", "disk-usage"];
  const components = ["current-load", "free", "read", "write"];
  // sendData(client, "cpu-usage:current-load:runtime");
  // sendData(client, "mem-usage:used:runtime");
  // sendDataToDiskTS(
  //   client,
  //   "disk-usage:read:runtime",
  //   "disk-usage:write:runtime"
  // );
  sendDataToTraffiTS(client, "traffic:all:runtime");
};
sendForAll();
