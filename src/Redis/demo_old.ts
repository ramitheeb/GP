// const RedisTimeSeries = require('redistimeseries-js');

// const options = {
//     host: 'localhost',
//     port: 6379
// }

// const rtsClient = new RedisTimeSeries(options);
// const key = 'temperature2';

// const updateTemperature = async () => {
//     await rtsClient.add(key, Date.now(), Math.floor(Math.random() * 30)).send();
// }

// const start = async () => {
//     await rtsClient.connect();
//     await rtsClient.create(key).retention(60000).send();
//     // setInterval(updateTemperature, 1000);
//     console.log("sending temperature ");
//     updateTemperature();
    
// }

// start();
