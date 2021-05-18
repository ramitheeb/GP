export interface AuthInfoRequest {
  name: string;
  instruction: string;
  values: string[];
  numOfPrompts: number;
  prompts: string[];
  echo: boolean[];
}
