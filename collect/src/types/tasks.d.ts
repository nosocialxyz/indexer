export interface SimpleTask {
  name: string;
  start: (context: AppContext) => void;
  stop: () => Promise<boolean>;
}

export interface Task {
  name: string;
  start: () => void;
  stop: () => Promise<boolean>;
}
