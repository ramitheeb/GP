import { gql } from "apollo-server-core";

export const CommandChainOutput = gql`
  type CommandChainOutput {
    firedSuccessfully: Boolean
    output: String
  }
`;
export const FileType = gql`
  type File {
    filename: String!
    mimetype: String!
    encoding: String!
  }
`;
