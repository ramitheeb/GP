import systemInformation from "systeminformation";

const getTimeData = () => {
  return systemInformation.time();
};

export default getTimeData;
