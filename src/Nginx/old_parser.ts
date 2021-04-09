// import moment = require("moment");
import NginxParser = require("nginxparser");
import * as moment from "moment";
const format =
  "$remote_addr - $remote_user [$time_local] " +
  '"$request" $status $body_bytes_sent "$http_referer" "$http_user_agent"';

const parser = new NginxParser(format);

const path = "/var/log/nginx/access.log";
const x = moment("24/Mar/2021:12:32:55 +0200", "DD-MMM-YYYY hh:mm:ss Z");
let trafficStamps = [String];
parser.read(
  path,
  function (row) {
    const localTime = row.time_local;

    console.log(row.time_local);
  },
  function (err) {
    if (err) throw err;
    console.log("Done!");
  }
);
