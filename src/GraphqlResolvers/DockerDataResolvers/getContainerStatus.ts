import * as systemInformation from "systeminformation";

const getContainerStatus = (_, args, context) => {
  if (!context.req.username) return;
  return systemInformation.dockerContainerStats(args.id);
};

export default getContainerStatus;
