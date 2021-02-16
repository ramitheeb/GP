import systemInformation from "systeminformation";

const getMemData = () => {
  return systemInformation.mem();
};

export default getMemData;
