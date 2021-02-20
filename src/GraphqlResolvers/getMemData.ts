import * as systemInformation from "systeminformation";

const getMemData = (_, __, context) => {
  if (!context.req.username) return;
  return systemInformation.mem();
};

export default getMemData;
