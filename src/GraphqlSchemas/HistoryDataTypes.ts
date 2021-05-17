import { gql } from "apollo-server";

const HistoryDataTypes = gql`
  type CPUHistoryData {
    fromDate: Float
    toDate: Float
    data: [CurrentLoadData]
  }
  type DiskHistoryData {
    fromDate: Float
    toDate: Float
    data: [DisksIoData]
  }

  type MemHistoryData {
    fromDate: Float
    toDate: Float
    data: [MemData]
  }

  type NetworkHistoryData {
    fromDate: Float
    toDate: Float
    data: [NetworkStatsData]
  }
`;

export default HistoryDataTypes;
