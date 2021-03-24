import { DISK_TS_KEY, redisReadTSData } from "../Redis/redis_client";

const getDiskHistoryData = async (_, args, context) => {
  if (!context.req.username) return;

  var resolution: number = 150;
  var startDate: number = 0;
  var endDate: number = 0;
  var period: string;

  switch (args.option) {
    case "Day":
      endDate = new Date().getTime();
      startDate = endDate - 7 * 24 * 60 * 60 * 1000;
      break;
    case "Week":
      endDate = new Date().getTime();
      startDate = endDate - 5 * 7 * 24 * 60 * 60 * 1000;
      break;
    case "Month":
      endDate = new Date().getTime();
      startDate = endDate - 12 * 30 * 24 * 60 * 60 * 1000;
      break;
    case "Year":
      endDate = new Date().getTime();
      startDate = endDate - 4 * 12 * 30 * 24 * 60 * 60 * 1000;
      break;
    case "Custom":
      endDate = args.toDate;
      startDate = args.fromDate;
      break;
    default:
      return;
  }

  if (endDate - startDate < 2628000000) {
    period = "short";
  } else if (endDate - startDate < 15770000000) {
    period = "medium";
  } else if (endDate - startDate < 126100000000) {
    period = "long";
  } else return;

  const readSamples = await redisReadTSData(
    DISK_TS_KEY,
    "read",
    period,
    startDate,
    endDate,
    resolution
  );

  const writeSamples = await redisReadTSData(
    DISK_TS_KEY,
    "write",
    period,
    startDate,
    endDate,
    resolution
  );

  const data = readSamples.map((readElement, index) => {
    const rIO = readElement.getValue();
    const wIO =
      index < writeSamples.length - 1 ? writeSamples[index].getValue() : null;
    return {
      rIO: rIO,
      wIO: wIO,
      tIO: wIO ? rIO + wIO : null,
      rIO_sec: null,
      wIO_sec: null,
      tIO_sec: null,
      ms: null,
      timestamp: readElement.getTimestamp(),
    };
  });

  return {
    fromDate: startDate,
    toDate: endDate,
    data: data,
  };
};

export default getDiskHistoryData;
