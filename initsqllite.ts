import * as sqlite3 from "sqlite3";

const db = new sqlite3.Database("./database.db");

db.serialize(function () {
  db.run(
    "CREATE TABLE Alerts (id integer primary key autoincrement, type TEXT , start INTEGER NOT NULL, end INTEGER NOT NULL,metric TEXT NOT NULL ,rangeName TEXT NOT NULL,AlertName TEXT NOT NULL)"
  );
});

db.close();
