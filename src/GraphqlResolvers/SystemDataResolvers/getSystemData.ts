import * as systemInformation from "systeminformation";

const getSystemData = (_, __, context) => {
  if (!context.req.username) return;
  return systemInformation.system();
};

export default getSystemData;
