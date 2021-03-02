import { Sample, RedisTimeSeriesFactory } from "redis-time-series-ts";


var sampleRatePerDay = 30;

const f = async ()=>{
    const factory = new RedisTimeSeriesFactory();
    const client = factory.create();
    const key = "cpu-usage";
    let samples:Sample[] = [];
    for (let i = 0; i < 365; i++) {
        for (let j = 0; j < sampleRatePerDay; j++) {
            const sample = new Sample(key,Math.random()*100,1582903129000+86400000*i+Math.random()*864000000);
            samples.push(sample);
        }
        
    }
    console.log("Finished sampling");
    await client.multiAdd(samples);
    console.log("Finished adding");
    
    // console.log(samples[Math.floor((Math.random()*samples.length-1))]);
}
f();