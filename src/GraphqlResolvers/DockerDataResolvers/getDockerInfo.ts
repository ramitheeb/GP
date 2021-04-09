import * as systemInformation from "systeminformation";

const getDockerInfo = (_, __, context) => {
  if (!context.req.username) return;
  return systemInformation.dockerInfo();
};

export default getDockerInfo;
