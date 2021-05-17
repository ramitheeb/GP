export type AlertType = "s" | "d";
export interface Alert {
  id: number;
  type: AlertType;
  start: number;
  end: number;
  metric: string;
  component: string;
  rangeName: string;
  AlertName: string;
  contineuosTriggerCount: number;
  fired: boolean;
}
export interface AlertChecker {
  timerID: NodeJS.Timeout;
  alertList: Alert[];
}
