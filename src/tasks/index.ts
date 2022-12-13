import Bluebird from 'bluebird';
import { createAPI } from "./api-task";
import { createProfileTask } from "./profile-task";
import { createPublicationTask } from "./publication-task";

import { getProfiles } from './profile-task';
import { getPublications } from './publication-task';

export function loadTasks() {
  let tasks = [
    createAPI,
    //createProfileTask,
    createPublicationTask,
  ];
  //tasks = tasks.filter(n => n !== null );
  return Bluebird.mapSeries(tasks, (t: any) => {
    return t();
  });
}

export const apis = {
  getProfiles: getProfiles,
  getPublications: getPublications,
}
