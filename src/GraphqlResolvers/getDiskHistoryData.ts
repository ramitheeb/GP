import {
  Aggregation,
  RedisTimeSeriesFactory,
  TimestampRange,
} from "redis-time-series-ts";

const getDiskHistoryData = async (_, args, context) => {
  if (!context.req.username) return;

  const factory = new RedisTimeSeriesFactory();
  const client = factory.create();
  var resolution: number = 150;
  var startDate: number = 0;
  var endDate: number = 0;
  var readKey: string;
  var writeKey: string;
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
    readKey = "disk-usage:read:short";
    writeKey = "disk-usage:write:short";
  } else if (endDate - startDate < 15770000000) {
    readKey = "disk-usage:read:medium";
    writeKey = "disk-usage:write:medium";
  } else if (endDate - startDate < 126100000000) {
    readKey = "disk-usage:read:long";
    writeKey = "disk-usage:write:long";
  } else return;

  const readSamples = await client.range(
    readKey,
    new TimestampRange(startDate, endDate),
    undefined,
    new Aggregation("AVG", Math.floor((endDate - startDate) / resolution))
  );

  const writeSamples = await client.range(
    writeKey,
    new TimestampRange(startDate, endDate),
    undefined,
    new Aggregation("AVG", Math.floor((endDate - startDate) / resolution))
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
