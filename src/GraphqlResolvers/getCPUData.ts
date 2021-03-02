import * as systemInformation from "systeminformation";

const getCPUData = (_, __, context) => {
  if (!context.req.username) return;
  console.log("here2");
  
  return systemInformation.cpu();
};

export default getCPUData;
