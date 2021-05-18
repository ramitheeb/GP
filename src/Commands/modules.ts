export interface CommandChain {
  id?: number;
  scriptFileLocation: string;
  chainName: string;
  arguments: string[];
  chain?: string;
  passwordProtected: boolean;
}
