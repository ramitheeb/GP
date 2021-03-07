import { Aggregation, RedisTimeSeriesFactory, TimestampRange,Sample } from "redis-time-series-ts";
import * as si from "systeminformation";

const testing = async () => {
    const factor = 210 / 150;
    1614025918000;
    1613421118000;
    const factory = new RedisTimeSeriesFactory();
    const client = factory.create();
    var sampleFactor: number;

    const samples = await client.range("disk-usage:read:medium", new TimestampRange(1610742718000,1613421118000), undefined, new Aggregation("AVG", Math.floor((1613421118000-1610742718000)/150)));
    console.log(samples.length);
    
}
testing();