import { gql } from "apollo-server-express";

const TimeData = gql`
  type TimeData {
    current: String
    uptime: String
    timezone: String
    timezoneName: String
  }
`;

export default TimeData;
