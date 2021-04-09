import {
  Aggregation,
  RedisTimeSeriesFactory,
  Sample,
  TimestampRange,
} from "redis-time-series-ts";

export const MEMORY_TS_KEY = "mem-usage";
export const DISK_TS_KEY = "disk-usage";
export const CPU_LOAD_TS_KEY = "cpu-usage";
export const TRAFFIC_TS_KEY = "traffic";
const redisFactory = new RedisTimeSeriesFactory();
export const redisTSClient = redisFactory.create();

export const redisWriteTSData = (
  metric: string,
  component: string,
  period: string,
  data: number,
  date: number
) => {
  // console.log(`${metric} ${component} ${period} ${data} ${date}`);

  const sample = new Sample(`${metric}:${component}:${period}`, data, date);
  // console.log(`the sample is ${sample.getValue()}`);

  return redisTSClient.add(sample);
};

export const redisReadTSData = async (
  metric: string,
  component: string,
  period: string,
  startDateNum: number,
  endDateNum: number,
  resolution: number,
  aggregationMethod?: string | undefined
) => {
  const samples = await redisTSClient.range(
    `${metric}:${component}:${period}`,
    new TimestampRange(startDateNum, endDateNum),
    undefined,
    new Aggregation(
      aggregationMethod === undefined ? "AVG" : aggregationMethod,
      (endDateNum - startDateNum) / resolution
    )
  );
  return samples;
};
