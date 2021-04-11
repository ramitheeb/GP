import { Aggregation, Sample, TimestampRange } from "redis-time-series-ts";
import { generalRedisClient } from "../pubsub";
import {
  redisReadTSData,
  redisTSClient,
  redisWriteTSData,
} from "../Redis/redis_client";
import { convertTimeUnitToMS, roundUpTime } from "../Utils/round_up_time";

const getLastFridayTimestamp = (timestamp: number) => {
  const currentDay = new Date(timestamp).getUTCDay();
  const numOfDays = (currentDay + 2) % 7;
  const lastFridayDate = timestamp - numOfDays * convertTimeUnitToMS("D");
  return roundUpTime(lastFridayDate, "D", 1);
};

const demo = () => {
  const d = new Date();
  console.log(`Current Day ${d}`);

  // d.setTime(
  //   d.getTime() -
  //     convertTimeUnitToMS("D") * getNumOfDaysFromLastFriday(d.getTime())
  // );
  d.setTime(roundUpTime(d.getTime(), "D", 1));
  console.log(`Past Friday ${d}`);
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

const analyze = async () => {
  //Get information about previous samples
  let oldSamplesStart;
  let oldSamplesEnd;
  const prevSamplesStartString = await generalRedisClient.get(
    "mem-usage:used:adaptive-average:from-date"
  );

  const prevSamplesEndString = await generalRedisClient.get(
    "mem-usage:used:adaptive-average:to-date"
  );

  if (!prevSamplesStartString || !prevSamplesEndString) {
    oldSamplesStart = 0;
    oldSamplesEnd = 0;
  } else {
    oldSamplesStart = parseInt(prevSamplesStartString);
    oldSamplesEnd = parseInt(prevSamplesEndString);
  }
  const numOfOldSamples =
    (oldSamplesEnd - oldSamplesStart) / convertTimeUnitToMS("W");
  console.log("-------------------Sample Info-------------------");

  console.log(
    `old sample range : [${oldSamplesStart},${oldSamplesEnd}], num of previous samples : ${numOfOldSamples}`
  );

  //Get infromation about new samples
  const memTSInfo = await redisTSClient.info("mem-usage:used:medium");
  const lastTimestamp = memTSInfo.lastTimestamp;

  let newSamplesEnd = getLastFridayTimestamp(lastTimestamp);
  let newSamplesStart = oldSamplesEnd;

  let numOfNewSamples =
    (newSamplesEnd - newSamplesStart) / convertTimeUnitToMS("W");
  console.log(
    `new sample range : [${newSamplesStart},${newSamplesEnd}], num of new samples : ${numOfNewSamples}`
  );

  console.log(`-------------------Procedure Info-------------------`);

  //No need for prevoius values
  if (numOfNewSamples >= 12) {
    console.log("no need for previous values");

    //Cap the new samples range
    newSamplesStart = newSamplesEnd - 12 * convertTimeUnitToMS("W");

    numOfNewSamples = 12;
    console.log(
      `The difference between new samples date : ${
        (newSamplesEnd - newSamplesStart) / convertTimeUnitToMS("W")
      }, number of new samples : ${numOfNewSamples}`
    );

    let values: number[] = [];

    //Find the average of the new values
    for (let i = 0; i < 168; i++) {
      const currentHour = i * convertTimeUnitToMS("h");
      const nextHour = (i + 1) * convertTimeUnitToMS("h") - 1;
      let newSampleSum: number = 0;
      values = [];
      for (let j = 0; j < numOfNewSamples; j++) {
        const currentTime = currentHour + convertTimeUnitToMS("W") * j;
        const nextTime = nextHour + convertTimeUnitToMS("W") * j;

        const newSample = ((await redisTSClient.range(
          "mem-usage:used:medium",
          new TimestampRange(
            newSamplesStart + currentTime,
            newSamplesStart + nextTime
          ),
          undefined,
          new Aggregation("avg", convertTimeUnitToMS("h"))
        )) as Sample[])?.[0];
        values.push(newSample.getValue());
        newSampleSum += newSample.getValue();
      }
      console.log(`The values at ${currentHour} are ${[...values]}`);

      let adaptiveAVG: number = newSampleSum / numOfNewSamples;
      console.log(`The adaptive average at ${currentHour} is : ${adaptiveAVG}`);

      // redisWriteTSData(
      //   "mem-usage",
      //   "used",
      //   "adaptive-average",
      //   adaptiveAVG,
      //   currentHour
      // );
    }

    //Calculate standard deviation
    for (let i = 0; i < 168; i++) {
      const currentHour = i * convertTimeUnitToMS("h");
      const nextHour = (i + 1) * convertTimeUnitToMS("h") - 1;
      let newSampleVarianceSquare: number = 0;
      values = [];
      const sampleAVG = ((await redisTSClient.range(
        "mem-usage:used:adaptive-average",
        new TimestampRange(currentHour, nextHour),
        undefined
      )) as Sample[])?.[0];

      for (let j = 0; j < numOfNewSamples; j++) {
        const currentTime = currentHour + convertTimeUnitToMS("W") * j;
        const nextTime = nextHour + convertTimeUnitToMS("W") * j;

        const newSample = ((await redisTSClient.range(
          "mem-usage:used:medium",
          new TimestampRange(
            newSamplesStart + currentTime,
            newSamplesStart + nextTime
          ),
          undefined,
          new Aggregation("avg", convertTimeUnitToMS("h"))
        )) as Sample[])?.[0];
        values.push(newSample?.getValue());
        newSampleVarianceSquare += Math.pow(
          newSample?.getValue() - sampleAVG.getValue(),
          2
        );
      }
      console.log(`The values at ${currentHour} are ${[...values]}`);

      let adaptiveSigma: number = Math.sqrt(
        newSampleVarianceSquare / numOfNewSamples
      );
      console.log(
        `The adaptive average at ${currentHour} is : ${adaptiveSigma}`
      );

      // redisWriteTSData(
      //   "mem-usage",
      //   "used",
      //   "adaptive-sigma",
      //   adaptiveSigma,
      //   currentHour
      // );
    }

    //Set the range values in redis
    // generalRedisClient.set(
    //   "mem-usage:used:adaptive-average:from-date",
    //   newSamplesStart
    // );
    // generalRedisClient.set(
    //   "mem-usage:used:adaptive-average:to-date",
    //   newSamplesEnd
    // );
    console.log(`New "old" range is [${newSamplesStart},${newSamplesEnd}]`);
  } else {
    const numOfTotalSumples = numOfOldSamples + numOfNewSamples;

    //Determine if there are enough values to implement a moving avg/sigma
    const moving: boolean = numOfTotalSumples > 12;
    if (moving) {
      for (let i = 0; i < 168; i++) {
        const currentHour = i * convertTimeUnitToMS("h");
        const nextHour = (i + 1) * convertTimeUnitToMS("h") - 1;
        let newSampleSum: number = 0;
        let newValues: Sample[] = [];
        for (let j = 0; j < 12 - numOfNewSamples; j++) {
          const currentTime = currentHour + convertTimeUnitToMS("W") * j;
          const nextTime = nextHour + convertTimeUnitToMS("W") * j;

          const newSample: Sample = ((await redisTSClient.range(
            "mem-usage:used:medium",
            new TimestampRange(
              newSamplesStart + currentTime,
              newSamplesStart + nextTime
            ),
            undefined,
            new Aggregation("avg", convertTimeUnitToMS("h"))
          )) as Sample[])?.[0];

          newValues.push(newSample as Sample);
          newSampleSum += (newSample as Sample).getValue();
        }
        const adaptiveAVGSample = ((await redisTSClient.range(
          "mem-usage:used:adaptive-average",
          new TimestampRange(currentHour, nextHour),
          undefined
        )) as Sample[])?.[0];

        let adaptiveAVG: number = 0;
        if (!adaptiveAVGSample) {
          adaptiveAVG = 0;
        } else adaptiveAVG = adaptiveAVGSample.getValue();

        let currentSum = adaptiveAVG * (12 - numOfOldSamples);
        console.log(
          `current sum : ${currentSum}, adaptive average : ${adaptiveAVG}`
        );

        currentSum += newSampleSum;

        // console.log(
        //   `Current hour : ${currentHour}, Next hour : ${nextHour},\nNew sample : ${stringifySample(
        //     newValues
        //   )}\tAdaptive average : ${
        //     currentSum / (moving ? 12 : numOfTotalSumples)
        //   }`
        // );

        // redisWriteTSData(
        //   "mem-usage",
        //   "used",
        //   "adaptive-average",
        //   currentSum / (moving ? 12 : numOfTotalSumples),
        //   currentHour
        // );
      }
      oldSamplesStart =
        oldSamplesStart + (12 - numOfOldSamples) * convertTimeUnitToMS("W");
      numOfNewSamples = numOfNewSamples - (12 - numOfOldSamples);
    }
    console.log(
      `Total number of samples is ${numOfTotalSumples}, moving : ${moving}`
    );

    //Add and subtract the values from the cuurent moving average is possible
    for (let i = 0; i < 168; i++) {
      const currentHour = i * convertTimeUnitToMS("h");
      const nextHour = (i + 1) * convertTimeUnitToMS("h") - 1;
      let newSampleSum: number = 0;
      let prevSampleSum: number = 0;
      let newValues: Sample[] = [];
      let prevValues: Sample[] = [];
      for (let j = 0; j < numOfNewSamples; j++) {
        const currentTime = currentHour + convertTimeUnitToMS("W") * j;
        const nextTime = nextHour + convertTimeUnitToMS("W") * j;

        const newSample: Sample = ((await redisTSClient.range(
          "mem-usage:used:medium",
          new TimestampRange(
            newSamplesStart + currentTime,
            newSamplesStart + nextTime
          ),
          undefined,
          new Aggregation("avg", convertTimeUnitToMS("h"))
        )) as Sample[])?.[0];

        newValues.push(newSample as Sample);
        newSampleSum += newSample.getValue();

        if (moving) {
          const prevSample = ((await redisTSClient.range(
            "mem-usage:used:medium",
            new TimestampRange(
              oldSamplesStart + currentTime,
              oldSamplesStart + nextTime
            ),
            undefined,
            new Aggregation("avg", convertTimeUnitToMS("h"))
          )) as Sample[])?.[0];
          prevValues.push(prevSample);

          prevSampleSum += prevSample.getValue();
        }
      }
      const adaptiveAVGSample = ((await redisTSClient.range(
        "mem-usage:used:adaptive-average",
        new TimestampRange(currentHour, nextHour),
        undefined
      )) as Sample[])?.[0];

      let adaptiveAVG: number = 0;
      if (!adaptiveAVGSample) {
        adaptiveAVG = 0;
      } else adaptiveAVG = adaptiveAVGSample.getValue();

      let currentSum = adaptiveAVG * numOfOldSamples;
      console.log(
        `current sum : ${currentSum}, adaptive average : ${adaptiveAVG}`
      );

      currentSum += newSampleSum - prevSampleSum;
      console.log(
        `Current hour : ${currentHour}, Next hour : ${nextHour},\nNew sample : ${stringifySample(
          newValues
        )}, prevSample: ${stringifySample(prevValues)}\tAdaptive average : ${
          currentSum / (moving ? 12 : numOfTotalSumples)
        }`
      );
      // redisWriteTSData(
      //   "mem-usage",
      //   "used",
      //   "adaptive-average",
      //   currentSum / (moving ? 12 : numOfTotalSumples),
      //   currentHour
      // );
    }

    //Find sigma
    if (moving) {
      //If number of old samples is under 12, add values from the new samples to it
      for (let i = 0; i < 168; i++) {
        const currentHour = i * convertTimeUnitToMS("h");
        const nextHour = (i + 1) * convertTimeUnitToMS("h") - 1;
        let newSampleVarianceSquare: number = 0;
        let newValues: Sample[] = [];
        const adaptiveAVGSample = ((await redisTSClient.range(
          "mem-usage:used:adaptive-average",
          new TimestampRange(currentHour, nextHour),
          undefined
        )) as Sample[])?.[0];
        let adaptiveAVG: number = 0;

        if (!adaptiveAVGSample) {
          adaptiveAVG = 0;
        } else adaptiveAVG = adaptiveAVGSample.getValue();
        for (let j = 0; j < 12 - numOfOldSamples; j++) {
          const currentTime = currentHour + convertTimeUnitToMS("W") * j;
          const nextTime = nextHour + convertTimeUnitToMS("W") * j;

          const newSample: Sample = ((await redisTSClient.range(
            "mem-usage:used:medium",
            new TimestampRange(
              newSamplesStart + currentTime,
              newSamplesStart + nextTime
            ),
            undefined,
            new Aggregation("avg", convertTimeUnitToMS("h"))
          )) as Sample[])?.[0];

          newValues.push(newSample as Sample);
          newSampleVarianceSquare += Math.pow(
            newSample.getValue() - adaptiveAVG,
            2
          );
        }
        const adaptiveSigmaSample = ((await redisTSClient.range(
          "mem-usage:used:adaptive-sigma",
          new TimestampRange(currentHour, nextHour),
          undefined
        )) as Sample[])?.[0];
        let adaptiveSigma: number = 0;
        let currentSum = adaptiveSigma * (12 - numOfOldSamples);
        console.log(
          `current sum : ${currentSum}, adaptive average : ${adaptiveAVG}`
        );

        currentSum += newSampleVarianceSquare;

        // console.log(
        //   `Current hour : ${currentHour}, Next hour : ${nextHour},\nNew sample : ${stringifySample(
        //     newValues
        //   )}\tAdaptive average : ${
        //     currentSum / (moving ? 12 : numOfTotalSumples)
        //   }`
        // );

        redisWriteTSData(
          "mem-usage",
          "used",
          "adaptive-average",
          Math.sqrt(currentSum / 12),
          currentHour
        );
      }
      oldSamplesStart =
        oldSamplesStart + (12 - numOfOldSamples) * convertTimeUnitToMS("W");
      numOfNewSamples = numOfNewSamples - (12 - numOfOldSamples);

      const cappedOldSamplesStart =
        oldSamplesStart + (12 - numOfNewSamples) * convertTimeUnitToMS("W");

      for (let i = 0; i < 168; i++) {
        const currentHour = i * convertTimeUnitToMS("h");
        const nextHour = (i + 1) * convertTimeUnitToMS("h") - 1;
        let prevValues: Sample[] = [];
        let prevSampleVarianceSquare: number = 0;
        const adaptiveAVGSample = ((await redisTSClient.range(
          "mem-usage:used:adaptive-average",
          new TimestampRange(currentHour, nextHour),
          undefined
        )) as Sample[])?.[0];
        let adaptiveAVG: number = 0;

        if (!adaptiveAVGSample) {
          adaptiveAVG = 0;
        } else adaptiveAVG = adaptiveAVGSample.getValue();

        for (let j = 0; j < 12 - numOfNewSamples; j++) {
          const currentTime = currentHour + convertTimeUnitToMS("W") * j;
          const nextTime = nextHour + convertTimeUnitToMS("W") * j;

          const prevSample = ((await redisTSClient.range(
            "mem-usage:used:medium",
            new TimestampRange(
              cappedOldSamplesStart + currentTime,
              cappedOldSamplesStart + nextTime
            ),
            undefined,
            new Aggregation("avg", convertTimeUnitToMS("h"))
          )) as Sample[])?.[0];
          prevValues.push(prevSample as Sample);

          prevSampleVarianceSquare += Math.pow(
            prevSample.getValue() - adaptiveAVG,
            2
          );
        }
        redisWriteTSData(
          "mem-usage",
          "used",
          "adaptive-sigma",
          Math.sqrt(prevSampleVarianceSquare / (12 - numOfNewSamples)),
          currentHour
        );
      }

      for (let i = 0; i < 168; i++) {
        const currentHour = i * convertTimeUnitToMS("h");
        const nextHour = (i + 1) * convertTimeUnitToMS("h") - 1;
        let newSampleVarianceSquare: number = 0;
        let newValues: Sample[] = [];
        const adaptiveAVGSample = ((await redisTSClient.range(
          "mem-usage:used:adaptive-average",
          new TimestampRange(currentHour, nextHour),
          undefined
        )) as Sample[])?.[0];

        let adaptiveAVG: number = 0;
        if (!adaptiveAVGSample) {
          adaptiveAVG = 0;
        } else adaptiveAVG = adaptiveAVGSample.getValue();

        for (let j = 0; j < numOfNewSamples; j++) {
          const currentTime = currentHour + convertTimeUnitToMS("W") * j;
          const nextTime = nextHour + convertTimeUnitToMS("W") * j;

          const newSample: Sample = ((await redisTSClient.range(
            "mem-usage:used:medium",
            new TimestampRange(
              newSamplesStart + currentTime,
              newSamplesStart + nextTime
            ),
            undefined,
            new Aggregation("avg", convertTimeUnitToMS("h"))
          )) as Sample[])?.[0];

          newValues.push(newSample);
          newSampleVarianceSquare += Math.pow(
            newSample.getValue() - adaptiveAVG,
            2
          );
        }
        const adaptiveSigmaSample = ((await redisTSClient.range(
          "mem-usage:used:adaptive-sigma",
          new TimestampRange(currentHour, nextHour),
          undefined
        )) as Sample[])?.[0];

        let adaptiveSigma: number = 0;
        if (!adaptiveSigmaSample) {
          adaptiveSigma = 0;
        } else adaptiveSigma = adaptiveSigmaSample.getValue();
        let currentSum = adaptiveSigma * (12 - oldSamplesStart);
        currentSum += newSampleVarianceSquare;
        redisWriteTSData(
          "mem-usage",
          "used",
          "adaptive-sigma",
          Math.sqrt(currentSum / 12),
          currentHour
        );
      }
    } else {
      //Set the range values in redis
      // generalRedisClient.set(
      //   "mem-usage:used:adaptive-average:from-date",
      //   oldSamplesStart
      // );
      // generalRedisClient.set(
      //   "mem-usage:used:adaptive-average:to-date",
      //   newSamplesEnd
      // );
      console.log(`New "old" range is [${oldSamplesStart},${newSamplesEnd}]`);
    }
  }

  console.log("Done");
};

analyze();
// demo();
