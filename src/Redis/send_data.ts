import { Sample, RedisTimeSeriesFactory } from "redis-time-series-ts";
import * as si from 'systeminformation';

var sampleRatePerDay = 30;

const f = async ()=>{
    const factory = new RedisTimeSeriesFactory();
    const client = factory.create();
    const key = "disk-usage:read:medium";
    let samples:Sample[] = [];
    for (let i = 0; i < 365; i++) {
        for (let j = 0; j < sampleRatePerDay; j++) {
            const sample = new Sample(key,Math.floor(Math.random()*48000+2000),1582903129000+86400000*i+Math.floor(Math.random()*864000000));
            samples.push(sample);
        }
        
    }
    console.log("Finished sampling");
    await client.multiAdd(samples);
    console.log("Finished adding");

    
}
f();
