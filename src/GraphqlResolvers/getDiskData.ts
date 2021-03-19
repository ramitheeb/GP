import * as systemInformation from "systeminformation";

const getDiskData = async (_, __, context) => {
  if (!context.req.username) return;
  const data = await systemInformation.disksIO();
  data["timestamp"] = new Date().getTime();
  return data;
};

export default getDiskData;
