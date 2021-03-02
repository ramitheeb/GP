
import { Label, RedisTimeSeriesFactory } from "redis-time-series-ts";
import { RedisTimeSeries } from "redis-time-series-ts/lib/redisTimeSeries";

const createDatabase=async (client:RedisTimeSeries,labels:Label[],key:string)=>{

    //Retention of 9 days
    await client.create(key,labels,7776000000);

}

const demoFunc = async ()=>{
    const factory = new RedisTimeSeriesFactory();
    const client = factory.create();
    const key = "disk-usage:read:medium";
    const labels = [new Label("Period","Medium Term")];
    createDatabase(client,labels,key);
    client.disconnect();
}
demoFunc();