type TimeUnit = "ms" | "s" | "m" | "h" | "D" | "W" | "M" | "Y";

export const convertTimeUnitToMS = (unit: TimeUnit) => {
  let untiInMs;
  switch (unit) {
    case "ms":
      untiInMs = 1;
      break;
    case "s":
      untiInMs = 1000;
      break;
    case "m":
      untiInMs = 60000;
      break;
    case "h":
      untiInMs = 3.6e6;
      break;
    case "D":
      untiInMs = 8.64e7;
      break;
    case "W":
      untiInMs = 6.048e8;
      break;
    case "M":
      untiInMs = 2.628e9;
      break;
    case "Y":
      untiInMs = 3.154e10;
      break;
  }
  return untiInMs;
};

export const roundUpTime = (time: number, unit: TimeUnit, amount: number) => {
  const untiInMs = convertTimeUnitToMS(unit);
  return time - (time % (untiInMs * amount));
};

export const getTimeUnit = (time: number, unit: TimeUnit, amount: number) => {
  const untiInMs = convertTimeUnitToMS(unit);
  return time % (untiInMs * amount);
};
