import { generalRedisClient } from "../pubsub";
interface EndpointStatisticsSample {
  endpoint: string;
  requestCount: number;
}
const getEndpointStatisticsHistory = async (_, args, context) => {
  if (!context.req.username) return;

  const samples = await generalRedisClient.hgetall("end-points");
  let data: EndpointStatisticsSample[] = [];

  for (const key in samples) {
    data.push({
      endpoint: key,
      requestCount: parseInt(samples[key]),
    });
  }
  return {
    data: data,
  };
};

export default getEndpointStatisticsHistory;
