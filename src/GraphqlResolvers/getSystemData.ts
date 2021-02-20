import * as systemInformation from "systeminformation";

const getSystemData = () => {
  return systemInformation.system();
};

export default getSystemData;
