import { gql } from "apollo-server-express";

const SystemData = gql`
  type SystemData {
    manufacturer: String
    model: String
    version: String
    serial: String
    uuid: String
    sku: String
    virtual: Boolean
    virtualHost: String
    raspberry: RaspberryRevisionData
  }
`;

export default SystemData;
