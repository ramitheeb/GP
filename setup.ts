import {
  Aggregation,
  AggregationType,
  Label,
  RedisTimeSeriesFactory,
} from "redis-time-series-ts";
import { RedisTimeSeries } from "redis-time-series-ts/lib/redisTimeSeries";
import * as sqlite3 from "sqlite3";

const setupRedis = async () => {
  const createDatabase = async (
    client: RedisTimeSeries,
    labels: Label[],
    key: string,
    retention: number,
    duplicationPolicy?: string | undefined
  ) => {
    //Retention of 9 days
    await client.create(key, labels, retention, undefined, duplicationPolicy);
  };

  const createForAll = async () => {
    const factory = new RedisTimeSeriesFactory();
    const client = factory.create();
    const metrics = [
      "cpu-usage",
      "mem-usage",
      "disk-usage",
      "disk-usage",
      "traffic",
    ];
    const components = ["current-load", "used", "read", "write", "all"];
    const periods = ["runtime", "short", "medium", "long"];
    // 10 mins - 1 month - 6 months - 4 years
    const retentions = [120000, 2628000000, 15770000000, 126100000000];
    for (let i = 0; i < metrics.length; i++) {
      const metric = metrics[i];
      const component = components[i];
      for (let j = 0; j < periods.length; j++) {
        const period = periods[j];
        const retention = retentions[j];
        const key = `${metric}:${component}:${period}`;
        const labels = [
          new Label("Metric", metric),
          new Label("Component", component),
          new Label("Period", period),
        ];
        const duplicationPolicy = metric === "traffic" ? "SUM" : undefined;
        await createDatabase(client, labels, key, retention, duplicationPolicy);
      }
      await client.create(
        `${metric}:${component}:adaptive-average`,
        [
          new Label("Metric", metric),
          new Label("Component", component),
          new Label("SF", "average"),
        ],
        157700000000,
        undefined,
        "LAST"
      );
      await client.create(
        `${metric}:${component}:adaptive-sigma`,
        [
          new Label("Metric", metric),
          new Label("Component", component),
          new Label("SF", "sigma"),
        ],
        157700000000,
        undefined,
        "LAST"
      );
    }

    client.disconnect();
  };
  createForAll();

  const createTimeSeriesRule = async (
    client: RedisTimeSeries,
    srcKey: string,
    dstKey: string,
    timeBucket: number,
    aggregationType: AggregationType
  ) => {
    await client.createRule(
      srcKey,
      dstKey,
      new Aggregation(aggregationType, timeBucket)
    );
  };

  const compactForAll = async () => {
    const factory = new RedisTimeSeriesFactory();
    const client = factory.create();
    const metrics = [
      "cpu-usage",
      "mem-usage",
      "disk-usage",
      "disk-usage",
      "traffic",
    ];
    const components = ["current-load", "used", "read", "write", "all"];
    const periods = ["runtime", "short", "medium", "long"];

    // 1 min - 10 mins - 1hr
    const timeBuckets = [60000, 600000, 3600000];
    for (let i = 0; i < metrics.length; i++) {
      const metric = metrics[i];
      const component = components[i];
      for (let j = 1; j < periods.length; j++) {
        const srcPeriod = "runtime";
        const dstPeriod = periods[j];
        const srcKey = `${metric}:${component}:${srcPeriod}`;
        const dstKey = `${metric}:${component}:${dstPeriod}`;
        const aggregationType: AggregationType =
          metric === "traffic" ? AggregationType.SUM : AggregationType.AVG;
        await createTimeSeriesRule(
          client,
          srcKey,
          dstKey,
          timeBuckets[j - 1],
          aggregationType
        );
      }
    }

    client.disconnect();
  };
  compactForAll();
};

const setupSQLite = async () => {
  const db = new sqlite3.Database("./database.db");

  db.serialize(function () {
    db.run(
      "CREATE TABLE Alerts (id integer primary key autoincrement, type TEXT NOT NULL, start INTEGER NOT NULL, end INTEGER NOT NULL,metric TEXT NOT NULL ,component TEXT NOT NULL ,rangeName TEXT NOT NULL,AlertName TEXT NOT NULL)"
    );
    db.run(
      "CREATE TABLE CommandChains (id integer primary key autoincrement, chainName TEXT NOT NULL, scriptFileLocation TEXT NOT NULL, passwordProtected	INTEGER DEFAULT 0)"
    );
    db.run(
      "CREATE TABLE ChainArguments (id	INTEGER primary key autoincrement ,chainID	INTEGER,argument TEXT,argIndex  INTEGER)"
    );
    db.run(
      "CREATE TABLE ScheduledTasks (id	INTEGER primary key autoincrement ,taskName	TEXT NOT NULL,time INTEGER DEFAULT 1619740800000, type TEXT NOT NULL, chain ID INTEGER)"
    );
    db.run("CREATE TABLE Users (username	TEXT NOT NULL,role	TEXT )");
    db.run(
      "CREATE TABLE KeyAUTH (username TEXT NOT NULL,publicKeyLocation TEXT NOT NULL)"
    );
  });

  db.close();
};

export const setupAll = () => {
  setupRedis();
  setupSQLite();
};

setupAll();
