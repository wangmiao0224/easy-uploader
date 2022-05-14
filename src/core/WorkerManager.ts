const DEFAULT_MAX_WORKER_COUNT = 6;
enum STATE {
  PENDING = 0,
  RUNNING = 1,
}
type WorksType = {
    id:number
  state: STATE;
  worker: Worker;
};
class WorkerManager {
  maxWorkerCount: number;
  Worker: any;
  works: WorksType[] = [];
  constructor(worker: any, count = DEFAULT_MAX_WORKER_COUNT) {
    this.maxWorkerCount = count;
    this.Worker = worker;
      this.works = new Array(this.maxWorkerCount).fill(1).map((v, i) => { 
          return {
            id:i,
             state: STATE.PENDING,
             worker: new this.Worker(),
           }
      })
  }
  postMessage(data: any): Promise<any> {
    return new Promise((resolve) => {
      const worker =
        this.works.filter((wk) => wk.state === STATE.PENDING)[0] ||
        this.works[Math.floor(Math.random() * this.maxWorkerCount)];
      worker.worker.postMessage(data);
      worker.state = STATE.RUNNING;
        worker.worker.onmessage = (data) => {
        worker.state = STATE.PENDING;
          resolve(data);
      };
    });
  }
  terminate(): void {
    this.works.forEach(({ worker }) => {
      worker.terminate();
    });
  }
}

export default WorkerManager;
