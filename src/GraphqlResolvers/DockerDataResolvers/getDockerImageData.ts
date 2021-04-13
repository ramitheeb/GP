import * as systemInformation from "systeminformation";

const getDockerImageData = (_, __, context) => {
  if (!context.req.username) return;
  return systemInformation.dockerImages();
};

export default getDockerImageData;
