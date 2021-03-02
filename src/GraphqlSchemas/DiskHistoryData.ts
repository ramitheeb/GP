import { gql } from "apollo-server";

const DiskHistoryData = gql`
    type DiskHistoryData{
        fromDate:Float,
        toDate: Float,
        data:[DisksIoData]
    }

`;

export default DiskHistoryData;