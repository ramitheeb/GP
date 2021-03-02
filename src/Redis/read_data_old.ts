// // const RedisTimeSeries = require('redistimeseries-js');
// import * as ReoisTimeSeries from  'redistimeseries-js';
// const si = require('systeminformation');
// const options = {
//     host: 'localhost',
//     port: 6379
// }

// const rtsClient = new RedisTimeSeries(options);

// const key = 'mem-usage';

// var timer;

// const receiveData = async () =>{
//     const data = await rtsClient.get(key).send();
//     console.log(data);
    
// }

// const recieveRange = async ()=>{
//     const data = await rtsClient.range(key,0,100000000000000).send();
//     console.log(data);
    
// }

// const testingFunc = async () => {
//     await rtsClient.connect();
//     await receiveData();
//     await recieveRange();
// }

// testingFunc()
