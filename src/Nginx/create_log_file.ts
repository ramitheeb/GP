import { NginxConfFile } from "nginx-conf";

/*For all nginx sites*/
NginxConfFile.create("/etc/nginx/nginx.conf", (err, conf) => {
  if (err) {
    console.log(err || !conf);
    return;
  }
  const onFlushed = () => {
    console.log("finished writing to disk");
  };

  conf?.on("flushed", onFlushed);

  conf?.nginx.http?.[0]._add(
    "log_fomrat",
    "retina_log_analysis '$remote_addr \"$request\" [$time_iso8601]'"
  );

  conf?.nginx.http?.[0]._add(
    "access_log",
    "/home/ibrahim-ubuntu/Documents/GP/ServerMonitor/src/Nginx/analysis_log.log"
  );

  conf?.flush();
});

/*For a specific nginx server*/
// NginxConfFile.create(
//   "/etc/nginx/sites-available/sombrero_project",
//   (err, conf) => {
//     //   console.log(conf?.nginx.http?.[0]);

//     if (err) {
//       console.log(err || !conf);
//       return;
//     }
//     const onFlushed = () => {
//       console.log("finished writing to disk");
//     };

//     conf?.on("flushed", onFlushed);

//     conf?.nginx.server?.[0]._add(
//       "log_fomrat",
//       "retina_log_analysis '$remote_addr \"$request\" [$time_iso8601]'"
//     );

//     conf?.nginx.server?.[0]._add(
//       "access_log",
//       "/home/ibrahim-ubuntu/Documents/GP/ServerMonitor/src/Nginx/analysis_log.log retina_log_analysis"
//     );
//     conf?.flush();
//   }
// );
