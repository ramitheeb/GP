// const RedisTimeSeries = require('redistimeseries-js');
// const si = require('systeminformation');

// const options = {
//     host: 'localhost',
//     port: 6379
// }

// const rtsClient = new RedisTimeSeries(options);

// const key = 'mem-usage';

// var memoryUsage = new Array();
// var timer;



// const createSeries = async () => {
//     await rtsClient.create(key).retention(60000).labels({enviroemt : "testing",data:"real"}).send();

// }

// const sendMemData = async () => {
//     const data = await si.mem();
//     const usage = data['free'];
//     await rtsClient.add(key,Date.now(), usage).send();
// }

// const testingFunc = async () => {
//     await rtsClient.connect();
//     // await createSeries();
//     timer = setInterval(sendMemData,100)

// }

// testingFunc()
