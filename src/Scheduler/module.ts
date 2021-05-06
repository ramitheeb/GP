type TaskType = "root" | "chain";

export interface ScheduledTaskDB {
  id: number;
  taskName: string;
  time: number;
  type: TaskType;
}

export interface ScheduledChain extends ScheduledTaskDB {
  chian: number;
}
