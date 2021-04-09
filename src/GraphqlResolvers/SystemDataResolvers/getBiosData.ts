import * as systemInformation from "systeminformation";

const getBiosData = (_, __, context) => {
  if (!context.req.username) return;
  return systemInformation.bios();
};

export default getBiosData;
