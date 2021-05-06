import { Aggregation, Sample, TimestampRange } from "redis-time-series-ts";
import {
  MEASURED_COMPONENTS,
  MEASURED_METRICS,
  redisReadTSData,
  redisTSClient,
  redisWriteTSData,
} from "../Redis/redis_client";
import { convertTimeUnitToMS, roundUpTime } from "../Utils/round_up_time";
import * as Redis from "ioredis";
const generalRedisClient = new Redis();

export const getLastFridayTimestamp = (timestamp: number) => {
  const currentDay = new Date(timestamp).getUTCDay();
  const numOfDays = (currentDay + 2) % 7;
  const lastFridayDate = timestamp - numOfDays * convertTimeUnitToMS("D");
  return roundUpTime(lastFridayDate, "D", 1);
};

const stringifySample = (samples: Sample[]) => {
  let s: string = "[";
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    s += `time : ${sample.getTimestamp()}, value : ${sample.getValue()} `;
  }
  s += "]";
  return s;
};

export const getDayAndHour = (date: Date) => {
  const day = (date.getDay() + 2) % 7;
  const hour = date.getHours();
  return hour * convertTimeUnitToMS("h") + day * convertTimeUnitToMS("D");
};

export const analyzeMetrics = async () => {
  for (let i = 0; i < MEASURED_METRICS.length; i++) {
    await analyze(MEASURED_METRICS[i], MEASURED_COMPONENTS[i]).catch((err) => {
      console.log(
        `An error occured while tryig to analyze metric${i} : ${err}`
      );
    });
  }
};

const analyze = async (metric: string, component: string) => {
  const key = `${metric}:${component}`;
  console.log(`adaptiveMetricsAnalysis : analyzing ${key}`);

  //Get information about previous samples
  let oldSamplesStart = 0;
  let oldSamplesEnd = 0;
  const prevSamplesStartString = await generalRedisClient
    .get(`${key}:adaptive-average:from-date`)
    .catch((e) => {
      console.log(`Error getting from date : ${e}`);
    });

  const prevSamplesEndString = await generalRedisClient
    .get(`${key}:adaptive-average:to-date`)
    .catch((e) => {
      console.log(`Error getting to date : ${e}`);
    });

  if (prevSamplesStartString && prevSamplesEndString) {
    oldSamplesStart = parseInt(prevSamplesStartString);
    oldSamplesEnd = parseInt(prevSamplesEndString);
  }

  const numOfOldSamples =
    (oldSamplesEnd - oldSamplesStart) / convertTimeUnitToMS("W");

  // console.log("-------------------Sample Info-------------------");

  // console.log(
  //   `old sample range : [${oldSamplesStart},${oldSamplesEnd}], num of previous samples : ${numOfOldSamples}`
  // );

  //Get infromation about new samples
  const memTSInfo = await redisTSClient.info(`${key}:medium`).catch((e) => {
    console.log(`Error getting time series info : ${e}`);
  });
  if (!memTSInfo) {
    console.log(
      `An error occured trying to get information about ${key}:medium`
    );
    return;
  }
  const lastTimestamp = memTSInfo.lastTimestamp;

  let newSamplesEnd = getLastFridayTimestamp(lastTimestamp);
  let newSamplesStart = oldSamplesEnd;

  let numOfNewSamples =
    (newSamplesEnd - newSamplesStart) / convertTimeUnitToMS("W");
  // console.log(
  //   `new sample range : [${newSamplesStart},${newSamplesEnd}], num of new samples : ${numOfNewSamples}`
  // );

  // console.log(`-------------------Procedure Info-------------------`);

  //No need for prevoius values
  if (numOfNewSamples >= 12) {
    //Cap the new samples range
    newSamplesStart = newSamplesEnd - 12 * convertTimeUnitToMS("W");

    numOfNewSamples = 12;
    // console.log(
    //   `The difference between new samples date : ${
    //     (newSamplesEnd - newSamplesStart) / convertTimeUnitToMS("W")
    //   }, number of new samples : ${numOfNewSamples}`
    // );

    let values: number[] = [];
    let existingSampleCount = 0;
    //Find the average of the new values
    for (let i = 0; i < 168; i++) {
      const currentHour = i * convertTimeUnitToMS("h");
      const nextHour = (i + 1) * convertTimeUnitToMS("h") - 1;
      let newSampleSum: number = 0;
      existingSampleCount = 0;
      values = [];
      for (let j = 0; j < numOfNewSamples; j++) {
        const currentTime = currentHour + convertTimeUnitToMS("W") * j;
        const nextTime = nextHour + convertTimeUnitToMS("W") * j;

        const newSample = ((await redisTSClient
          .range(
            `${key}:medium`,
            new TimestampRange(
              newSamplesStart + currentTime,
              newSamplesStart + nextTime
            ),
            1,
            new Aggregation("avg", convertTimeUnitToMS("h"))
          )
          .catch((e) => {
            console.log(`Error getting new sample : ${e}`);
          })) as Sample[])?.[0];
        if (newSample) {
          values.push(newSample.getValue());
          newSampleSum += newSample.getValue();
          existingSampleCount++;
        }
      }
      // console.log(`The values at ${currentHour} are ${[...values]}`);

      let adaptiveAVG: number = newSampleSum / existingSampleCount;
      // console.log(`The adaptive average at ${currentHour} is : ${adaptiveAVG}`);

      redisWriteTSData(
        metric,
        component,
        "adaptive-average",
        adaptiveAVG,
        currentHour
      )
        .catch((e) => {
          console.log(`Error writing data : ${e}`);
        })
        .catch((err) => {
          console.log(
            `An error occured while trying to add new adaptive average : ${err}`
          );
        });
    }

    //Calculate standard deviation
    for (let i = 0; i < 168; i++) {
      const currentHour = i * convertTimeUnitToMS("h");
      const nextHour = (i + 1) * convertTimeUnitToMS("h") - 1;
      let newSampleVarianceSquare: number = 0;
      let existingSampleCount: number = 0;
      values = [];
      const sampleAVG = ((await redisTSClient
        .range(
          `${key}:adaptive-average`,
          new TimestampRange(currentHour, nextHour),
          1
        )
        .catch((err) => {
          console.log(
            `An error occured while trying to get sample avg value : ${err}`
          );
        })) as Sample[])?.[0];

      for (let j = 0; j < numOfNewSamples; j++) {
        const currentTime = currentHour + convertTimeUnitToMS("W") * j;
        const nextTime = nextHour + convertTimeUnitToMS("W") * j;

        const newSample = ((await redisTSClient
          .range(
            `${key}:medium`,
            new TimestampRange(
              newSamplesStart + currentTime,
              newSamplesStart + nextTime
            ),
            1,
            new Aggregation("avg", convertTimeUnitToMS("h"))
          )
          .catch((e) => {
            console.log(`Error getting new sample (sigma) : ${e}`);
          })) as Sample[])?.[0];
        if (newSample) {
          values.push(newSample?.getValue());
          newSampleVarianceSquare += Math.pow(
            newSample?.getValue() - sampleAVG.getValue(),
            2
          );
          existingSampleCount++;
        }
      }
      // console.log(`The values at ${currentHour} are ${[...values]}`);

      let adaptiveSigma: number = Math.sqrt(
        newSampleVarianceSquare / existingSampleCount
      );
      // console.log(`The adaptive sigma at ${currentHour} is : ${adaptiveSigma}`);

      redisWriteTSData(
        metric,
        component,
        "adaptive-sigma",
        adaptiveSigma,
        currentHour
      )
        .catch((e) => {
          // console.log(`Error writing data : ${e}`);
        })
        .catch((err) => {
          console.log(
            `An error occured while trying to add adaptive sigma  : ${err}`
          );
        });
    }

    //Set the range values in redis
    generalRedisClient.set(
      `${key}:adaptive-average:from-date`,
      newSamplesStart
    );
    generalRedisClient.set(`${key}:adaptive-average:to-date`, newSamplesEnd);
    // console.log(`New "old" range is [${newSamplesStart},${newSamplesEnd}]`);
  } else {
    const numOfTotalSumples = numOfOldSamples + numOfNewSamples;

    //Adaptive Average
    //Add new values and subtract extra old ones
    for (let i = 0; i < 168; i++) {
      const currentHour = i * convertTimeUnitToMS("h");
      const nextHour = (i + 1) * convertTimeUnitToMS("h") - 1;
      let newSampleSum: number = 0;
      let existingNewSampleCount: number = 0;
      let prevSampleSum: number = 0;
      let existingPrevSampleCount: number = 0;
      let newValues: Sample[] = [];
      let prevValues: Sample[] = [];
      for (let j = 0; j < numOfNewSamples; j++) {
        // console.log("enetred here for some reason");

        const currentTime = currentHour + convertTimeUnitToMS("W") * j;
        const nextTime = nextHour + convertTimeUnitToMS("W") * j;
        const newSample: Sample = ((await redisTSClient
          .range(
            `${key}:medium`,
            new TimestampRange(
              newSamplesStart + currentTime,
              newSamplesStart + nextTime
            ),
            1,
            new Aggregation("avg", convertTimeUnitToMS("h"))
          )
          .catch((err) => {})) as Sample[])?.[0];
        if (newSample) {
          newValues.push(newSample as Sample);
          newSampleSum += (newSample as Sample).getValue();
          existingNewSampleCount++;
        }

        //Subtract extra values
        if (numOfOldSamples + j > 12) {
          const prevSample = ((await redisTSClient
            .range(
              `${key}:medium`,
              new TimestampRange(
                oldSamplesStart + currentTime,
                oldSamplesStart + nextTime
              ),
              1,
              new Aggregation("avg", convertTimeUnitToMS("h"))
            )
            .catch((err) => {})) as Sample[])?.[0];
          if (prevSample) {
            prevValues.push(prevSample);
            prevSampleSum += prevSample.getValue();
            existingPrevSampleCount++;
          }
        }
      }

      const adaptiveAVGSample = ((await redisTSClient
        .range(
          `${key}:adaptive-average`,
          new TimestampRange(currentHour, nextHour),
          1
        )
        .catch((err) => {
          console.log(
            `An error occured trying to retrieve old average value : ${err}`
          );
        })) as Sample[])?.[0];

      let adaptiveAVG: number = 0;
      if (adaptiveAVGSample) adaptiveAVG = adaptiveAVGSample.getValue();

      let currentSum = adaptiveAVG * numOfOldSamples;
      // console.log(
      //   `current sum : ${currentSum}, adaptive average : ${adaptiveAVG}`
      // );

      currentSum += newSampleSum - prevSampleSum;
      // console.log(
      //   `Current hour : ${currentHour}, Next hour : ${nextHour},\nNew sample : ${stringifySample(
      //     newValues
      //   )}, prevSample: ${stringifySample(prevValues)}\tAdaptive average : ${
      //     currentSum / (numOfTotalSumples > 12 ? 12 : numOfTotalSumples)
      //   }`
      // );
      redisWriteTSData(
        metric,
        component,
        "adaptive-average",
        currentSum /
          (numOfOldSamples - existingPrevSampleCount + existingNewSampleCount >
          12
            ? 12
            : numOfOldSamples -
                existingPrevSampleCount +
                existingNewSampleCount >
              0
            ? numOfOldSamples - existingPrevSampleCount + existingNewSampleCount
            : 1),
        currentHour
      ).catch((err) => {
        console.log(
          `An error occured while trying to add adaptive average with current sum ${currentSum} and value ${
            currentSum /
            (numOfOldSamples -
              existingPrevSampleCount +
              existingNewSampleCount >
            12
              ? 12
              : numOfOldSamples -
                  existingPrevSampleCount +
                  existingNewSampleCount >
                0
              ? numOfOldSamples -
                existingPrevSampleCount +
                existingNewSampleCount
              : 1)
          }: ${err}`
        );
      });
    }

    //Adaptive Sigma
    //Add new values and subtract extra old ones
    for (let i = 0; i < 168; i++) {
      const currentHour = i * convertTimeUnitToMS("h");
      const nextHour = (i + 1) * convertTimeUnitToMS("h") - 1;
      let newSampleVarianceSquare: number = 0;
      let existingNewSampleCount: number = 0;
      let prevSampleVarianceSquare: number = 0;
      let existingPrevSampleCount: number = 0;
      let newValues: Sample[] = [];
      let prevValues: Sample[] = [];
      const adaptiveAVGSample = ((await redisTSClient
        .range(
          `${key}:adaptive-average`,
          new TimestampRange(currentHour, nextHour),
          1
        )
        .catch((err) => {})) as Sample[])?.[0];
      let adaptiveAVG: number = 0;

      if (adaptiveAVGSample) adaptiveAVG = adaptiveAVGSample.getValue();
      for (let j = 0; j < numOfNewSamples; j++) {
        // console.log("entered here");

        const currentTime = currentHour + convertTimeUnitToMS("W") * j;
        const nextTime = nextHour + convertTimeUnitToMS("W") * j;

        const newSample: Sample = ((await redisTSClient
          .range(
            `${key}:medium`,
            new TimestampRange(
              newSamplesStart + currentTime,
              newSamplesStart + nextTime
            ),
            1,
            new Aggregation("avg", convertTimeUnitToMS("h"))
          )
          .catch((err) => {})) as Sample[])?.[0];
        if (newSample) {
          newValues.push(newSample as Sample);
          newSampleVarianceSquare += Math.pow(
            newSample.getValue() - adaptiveAVG,
            2
          );
          existingNewSampleCount++;
        }

        if (numOfOldSamples + j > 12) {
          const prevSample = ((await redisTSClient
            .range(
              `${key}:medium`,
              new TimestampRange(
                oldSamplesStart + currentTime,
                oldSamplesStart + nextTime
              ),
              1,
              new Aggregation("avg", convertTimeUnitToMS("h"))
            )
            .catch((err) => {})) as Sample[])?.[0];
          if (prevSample) {
            prevValues.push(prevSample as Sample);
            prevSampleVarianceSquare += Math.pow(
              prevSample.getValue() - adaptiveAVG,
              2
            );
            existingPrevSampleCount++;
          }
        }
      }
      const adaptiveSigmaSample = ((await redisTSClient
        .range(
          `${key}:adaptive-sigma`,
          new TimestampRange(currentHour, nextHour),
          1
        )
        .catch((err) => {
          console.log(
            `An error occured while trying to add adaptive sigma : ${err}`
          );
        })) as Sample[])?.[0];
      let adaptiveSigma: number = 0;
      if (adaptiveSigmaSample) adaptiveSigma = adaptiveSigmaSample.getValue();
      let currentSum = Math.pow(adaptiveSigma, 2) * numOfOldSamples;
      // console.log(
      //   `current sum : ${currentSum}, adaptive average : ${adaptiveAVG}`
      // );

      currentSum += newSampleVarianceSquare - prevSampleVarianceSquare;
      redisWriteTSData(
        metric,
        component,
        "adaptive-sigma",
        Math.sqrt(
          currentSum /
            (numOfOldSamples -
              existingPrevSampleCount +
              existingNewSampleCount >
            12
              ? 12
              : numOfOldSamples -
                  existingPrevSampleCount +
                  existingNewSampleCount >
                0
              ? numOfOldSamples -
                existingPrevSampleCount +
                existingNewSampleCount
              : 1)
        ),
        currentHour
      ).catch((err) => {
        console.log(
          `An error occured while trying to add adaptive sigma  : ${err}`
        );
      });

      //Set the range values in redis
      generalRedisClient.set(
        "mem-usage:used:adaptive-average:from-date",
        numOfTotalSumples > 12
          ? newSamplesEnd - 12 * convertTimeUnitToMS("W")
          : oldSamplesStart
      );
      generalRedisClient.set(
        "mem-usage:used:adaptive-average:to-date",
        newSamplesEnd
      );
    }
  }
};
