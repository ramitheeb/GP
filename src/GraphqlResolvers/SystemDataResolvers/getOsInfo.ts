import * as systemInformation from "systeminformation";

const getOsInfo = (_, __, context) => {
  if (!context.req.username) return;
  return systemInformation.osInfo();
};

export default getOsInfo;
