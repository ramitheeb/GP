import * as systemInformation from "systeminformation";

const getDiskData = (_, __, context) => {
    if (!context.req.username) return;
    return systemInformation.disksIO();
}

export default getDiskData;