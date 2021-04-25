export interface CommandChain {
  id?: number;
  scriptFileLocation: string;
  workingDirectory: string;
  chainName: string;
  arguments: string[];
  chain?: string[];
}
