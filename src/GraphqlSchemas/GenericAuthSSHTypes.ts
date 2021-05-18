import { gql } from "apollo-server-core";

export const AuthenticationRequestResponse = gql`
  type AuthenticationRequestResponse {
    success: Boolean
    fail: Boolean
    infoRequest: AuthenticationInfoResponse
  }
`;

export const AuthenticationInfoRequest = gql`
  type AuthenticationInfoResponse {
    name: String!
    instruction: String!
    values: [String]
    numOfPrompts: Int
    prompts: [String]!
    echo: [Boolean]!
  }
`;
