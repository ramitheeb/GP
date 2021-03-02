
import { Label, RedisTimeSeriesFactory } from "redis-time-series-ts";
import { RedisTimeSeries } from "redis-time-series-ts/lib/redisTimeSeries";

const createDatabase=async (client:RedisTimeSeries,labels:Label[],key:string)=>{

    await client.create(key,labels,31500000000);

}

const demoFunc = async ()=>{
    const factory = new RedisTimeSeriesFactory();
    const client = factory.create();
    const key = "cpu-usage";
    const labels = [new Label("Period","LongTerm")];
    createDatabase(client,labels,key);
    client.disconnect();
}
demoFunc();