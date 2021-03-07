import { Aggregation, RedisTimeSeriesFactory, TimestampRange } from "redis-time-series-ts";


const getDiskHistoryData = async (_, args, context) => {

    if (!context.req.username) return;


    const factory = new RedisTimeSeriesFactory();
    const client = factory.create();
    var sampleFactor: number;
    var startDate: number = 0;
    var endDate: number = 0;

    switch (args.option) {
        case "Day":
            endDate = (new Date()).getTime();
            startDate = endDate - 7 * 24 * 60 * 60 * 1000;
            break;
        case "Week":
            endDate = (new Date()).getTime();
            startDate = endDate - 5 * 7 * 24 * 60 * 60 * 1000;
            break;
        case "Month":
            endDate = (new Date()).getTime();
            startDate = endDate - 12 * 30 * 24 * 60 * 60 * 1000;
            break;
        case "Year":
            endDate = (new Date()).getTime();
            startDate = endDate - 5*12*30* 24 * 60 * 60 * 1000;
            break;
        case "Custom":
            endDate = args.toDate; 
            startDate = args.fromDate;
            break;
        default:
            return;
    }

    
    
    const samples = await client.range("disk-usage:read:medium", new TimestampRange(startDate,endDate), undefined, new Aggregation("AVG", Math.floor((endDate-startDate)/150)));

    const data = [{}];
    for (let i = 0; i < samples.length; i++) {
        const element = samples[i];

        data[i] = {

            rIO: element.getValue(),
            wIO: null,
            tIO: null,
            rIO_sec: null,
            wIO_sec: null,
            tIO_sec: null,
            ms: null,
            timestamp: element.getTimestamp()
        }

    }

    return {
        fromDate: args.fromDate,
        toDate: args.toDate,
        data: data,
    }

}

export default getDiskHistoryData;