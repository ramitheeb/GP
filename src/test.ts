import * as si from "systeminformation";
const testing = async () => {
  const data = await si.users();
  console.log(data);
};
testing();
