import { generalRedisClient } from "../pubsub";
interface DemographicGeoStatisticsSample {
  country: string;
  requestCount: number;
}
const getDemographicStatisticsHistory = async (_, args, context) => {
  if (!context.req.username) return;

  const samples = await generalRedisClient.hgetall("demographic");
  let data: DemographicGeoStatisticsSample[] = [];

  for (const key in samples) {
    data.push({
      country: key,
      requestCount: parseInt(samples[key]),
    });
  }
  return {
    data: data,
  };
};

export default getDemographicStatisticsHistory;
