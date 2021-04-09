import * as systemInformation from "systeminformation";

const getCurrentLoadData = async (_, __, context) => {
  if (!context.req.username) return;
  const data = await systemInformation.currentLoad();
  data["timestamp"] = new Date().getTime();
  return data;
};

export default getCurrentLoadData;
