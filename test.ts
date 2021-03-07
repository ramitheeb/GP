const si = require("systeminformation");
si.currentLoad().then((data) => console.log(data));
