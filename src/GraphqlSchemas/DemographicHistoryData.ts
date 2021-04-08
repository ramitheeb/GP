import { gql } from "apollo-server-core";

export const DemographicGeoStatisticsHistoryData = gql`
  type DemoGraphicGeoStatisticsHistoryData {
    data: [DemographicGeoStatistics]
  }
`;
