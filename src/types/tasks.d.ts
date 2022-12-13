export interface Task {
  name: string;
  start: () => void;
  stop: () => Promise<boolean>;
}
