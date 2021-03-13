import {
  Aggregation,
  RedisTimeSeriesFactory,
  TimestampRange,
} from "redis-time-series-ts";
import {
  dayQueryLength,
  longTimeSeriesPeriod,
  mediumTimeSeriesPeriod,
  monthQueryLength,
  shortTimeSeriesPeriod,
  weekQueryLength,
  yearQueryLength,
} from "../Redis/periods";

const getCPUHistoryData = async (_, args, context) => {
  if (!context.req.username) return;

  const factory = new RedisTimeSeriesFactory();
  const client = factory.create();
  let resolution: number = 150;
  let startDate: number = 0;
  let endDate: number = 0;
  let key: string;

  switch (args.option) {
    case "Day":
      endDate = new Date().getTime();
      startDate = endDate - dayQueryLength;
      break;
    case "Week":
      endDate = new Date().getTime();
      startDate = endDate - weekQueryLength;
      break;
    case "Month":
      endDate = new Date().getTime();
      startDate = endDate - monthQueryLength;
      break;
    case "Year":
      endDate = new Date().getTime();
      startDate = endDate - yearQueryLength;
      break;
    case "Custom":
      endDate = args.toDate;
      startDate = args.fromDate;
      break;
    default:
      return;
  }

  if (endDate - startDate < shortTimeSeriesPeriod)
    key = "cpu-usage:current-load:short";
  else if (endDate - startDate < mediumTimeSeriesPeriod)
    key = "cpu-usage:current-load:medium";
  else if (endDate - startDate < longTimeSeriesPeriod)
    key = "cpu-usage:current-load:long";
  else return;

  const samples = await client.range(
    key,
    new TimestampRange(startDate, endDate),
    undefined,
    new Aggregation("AVG", Math.floor((endDate - startDate) / resolution))
  );

  const data = [{}];
  for (let i = 0; i < samples.length; i++) {
    const element = samples[i];

    data[i] = {
      currentLoad: element.getValue(),
      timestamp: element.getTimestamp(),
    };
  }

  return {
    fromDate: startDate,
    toDate: endDate,
    data: data,
  };
};

export default getCPUHistoryData;
