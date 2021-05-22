import * as sqlite3 from "sqlite3";

const getAlerts = (_, __, context) => {
  if (!context.req.username) return;

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database("./database.db");
    const response: any = [];

    db.each(
      "SELECT id,start,type,end,metric,rangeName,AlertName as alertName FROM Alerts",
      function (err, row) {
        if (err) reject(err);
        else response.push(row);
      },
      (err, n) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      }
    );
  });
};

export default getAlerts;
