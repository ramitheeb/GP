export type AlertType = "s" | "d";
export interface Alert {
  id: number;
  type: AlertType;
  start: number;
  end: number;
  metric: string;
  rangeName: string;
  AlertName: string;
  contineuosTriggerCount: number;
}
