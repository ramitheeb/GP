import * as systemInformation from "systeminformation";

const getProcessesData = (_, __, context) => {
  if (!context.req.username) return;
  return systemInformation.processes();
};

export default getProcessesData;
