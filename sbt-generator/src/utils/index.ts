import dayjs from "dayjs";

export const sleep = (time: number) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

// eslint-disable-next-line
export function formatError(e: any): string {
  return (e as Error).stack || JSON.stringify(e);
}

export function randomRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min) + min);
}

export function getTimestamp(): number {
  return dayjs().unix();
}
