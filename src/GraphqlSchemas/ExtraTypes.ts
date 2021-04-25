import { gql } from "apollo-server-core";

export const CommandChainOutput = gql`
  type CommandChainOutput {
    firedSuccessfully: Boolean
    output: String
  }
`;
