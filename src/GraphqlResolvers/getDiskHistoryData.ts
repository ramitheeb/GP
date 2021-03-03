import { Aggregation, RedisTimeSeriesFactory, TimestampRange } from "redis-time-series-ts";


const getDiskHistoryData = async(_,args,context)=>{
    if(!context.req.username) return;


    const factory = new RedisTimeSeriesFactory();
    const client = factory.create();
    var sampleFactor: number;
    switch (args.option) {
        case "Day":
            sampleFactor = 150 / 7 * 30;
            break;

        default:
            break;
    }

    const samples = await client.range("disk-usage:read:medium", new TimestampRange(args.fromDate, args.toDate), undefined, new Aggregation("AVG", args.timeBucket));

    const data = [{}];
    for (let i = 0; i < samples.length; i++) {
        const element = samples[i];
        
        data[i] = {

            rio: element.getValue(),
            wio: null,
            tIO: null,
            rIO_sec: null,
            wIO_sec: null,
            tIO_sec: null,
            ms: null,
            timestamp:element.getTimestamp()
        }    

    }
    for (let i = 0; i < data.length; i++) {
        const element = data[i];
        console.log(element);
        
        
    }
    return {
        fromDate: args.fromDate,
        toDate: args.toDate,
        data: data,
    }

}

export default getDiskHistoryData;