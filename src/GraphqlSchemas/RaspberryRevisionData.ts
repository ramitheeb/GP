import { gql } from "apollo-server-express";

const RaspberryRevisionData = gql`
  type RaspberryRevisionData {
    manufacturer: String
    processor: String
    type: String
    revision: String
  }
`;

export default RaspberryRevisionData;
