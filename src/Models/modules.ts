export interface EndpointStatisticsSample {
  endpoint: string;
  requestCount: number;
}
export interface DemographicGeoStatisticsSample {
  country: string;
  requestCount: number;
}
export interface CommandChain {
  id?: number;
  scriptFileLocation: string;
  chainName: string;
  arguments: string[];
  chain?: string;
  passwordProtected: boolean;
}
