import * as sqlite3 from "sqlite3";

const db = new sqlite3.Database("./database.db");

db.serialize(function () {
  //   db.run(
  //     "CREATE TABLE Alerts (id integer primary key autoincrement, type TEXT NOT NULL, start INTEGER NOT NULL, end INTEGER NOT NULL,metric TEXT NOT NULL ,component TEXT NOT NULL ,rangeName TEXT NOT NULL,AlertName TEXT NOT NULL)"
  //   );
  //   db.run(
  //     "CREATE TABLE CommandChains (id integer primary key autoincrement, chainName TEXT NOT NULL, scriptFileLocation TEXT NOT NULL, passwordProtected	INTEGER DEFAULT 0)"
  //   );
  //   db.run(
  //     "CREATE TABLE ChainArguments (id	INTEGER primary key autoincrement ,chainID	INTEGER,argument TEXT,argIndex  INTEGER)"
  //   );
  //   db.run(
  //     "CREATE TABLE ScheduledTasks (id	INTEGER primary key autoincrement ,taskName	TEXT NOT NULL,time INTEGER DEFAULT 1619740800000, type TEXT NOT NULL, chain ID INTEGER)"
  //   );
  //   db.run("CREATE TABLE Users (username	TEXT NOT NULL,role	TEXT )");
  //   db.run(
  //     "CREATE TABLE KeyAUTH (username TEXT NOT NULL,publicKeyLocation TEXT NOT NULL)"
  //   );

  db.run(
    `CREATE TABLE Notifications (id	INTEGER, name	TEXT,  body	TEXT, url TEXT,PRIMARY KEY(id AUTOINCREMENT))`
  );
});

db.close();
