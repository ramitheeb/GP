import { gql } from "apollo-server-core";

export const CommandChainOutput = gql`
  type CommandChainOutput {
    firedSuccessfully: Boolean!
    requiresPassword: Boolean
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

export const NotificationType = gql`
  type Notification {
    id: Float!
    name: String
    body: String
    url: String
  }
`;
