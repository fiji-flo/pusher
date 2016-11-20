'use strict';
const TIMEOUT_MAX = 2147483647
const PRECISION = 1000;

module.exports = (() => {
  const jobs = new Map();
  const jobIds = new Map();

  let nextJob = Infinity
  let timer = undefined;
  let jobId = 0;

  function updateNextJob(when) {
    if (isFinite(when) && when < nextJob) {
      nextJob = when;
      const timeout = (when * PRECISION) - Date.now();
      console.log(timeout);
      timer = setTimeout(() => workIt(when), Math.min(timeout, TIMEOUT_MAX));
    }
  }

  function workIt(when) {
    const ids = jobs.get(when);
    if (ids) {
      for (let id of ids) {
        if (jobIds.has(id)) {
          const [_, what] = jobIds.get(id);
          what();
          jobIds.delete(id);
        }
      }
      jobs.delete(when);
    }
    nextJob = Infinity;
    updateNextJob(Math.min(...jobs.keys()));
  }

  return {
    add: (whenInMs, what) => {
      const when = Math.floor(whenInMs / PRECISION);
      updateNextJob(when);
      const jobList = jobs.get(when);
      if (jobList) {
        jobList.add(jobId);
      } else {
        jobs.set(when, new Set([jobId]));
      }
      jobIds.set(jobId, [when, what]);
      return jobId++;
    },
    remove: (id) => {
      if (jobIds.has(id)) {
        const [when, what] = jobIds.get(id);
        jobIds.delete(id);
        if (jobs.has(when)) {
          jobs.get(when).delete(id);
          jobs.get(when).size === 0 && jobs.delete(when);
        }
      }
    }
  };
})();
