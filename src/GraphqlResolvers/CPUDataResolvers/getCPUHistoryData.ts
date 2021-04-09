import {
  dayQueryLength,
  longTimeSeriesPeriod,
  mediumTimeSeriesPeriod,
  monthQueryLength,
  shortTimeSeriesPeriod,
  weekQueryLength,
  yearQueryLength,
} from "../../Redis/periods";
import { CPU_LOAD_TS_KEY, redisReadTSData } from "../../Redis/redis_client";

const getCPUHistoryData = async (_, args, context) => {
  if (!context.req.username) return;

  let resolution: number = 150;
  let startDate: number = 0;
  let endDate: number = 0;
  let period: string;

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

  if (endDate - startDate < shortTimeSeriesPeriod) period = "short";
  else if (endDate - startDate < mediumTimeSeriesPeriod) period = "medium";
  else if (endDate - startDate < longTimeSeriesPeriod) period = "long";
  else return;

  const samples = await redisReadTSData(
    CPU_LOAD_TS_KEY,
    "current-load",
    period,
    startDate,
    endDate,
    resolution
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
