import * as systemInformation from "systeminformation";

const getMemData = async (_, __, context) => {
  if (!context.req.username) return;
  const data = await systemInformation.mem();
  data["timestamp"] = new Date().getTime();
  return data;
};

export default getMemData;
