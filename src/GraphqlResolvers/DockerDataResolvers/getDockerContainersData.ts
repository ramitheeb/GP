import * as systemInformation from "systeminformation";

const getDockerContainersData = (_, __, context) => {
  if (!context.req.username) return;
  return systemInformation.dockerContainers();
};

export default getDockerContainersData;
