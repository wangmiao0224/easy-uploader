/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
//默认参数
const DEFAULT_MAX_WORKER_COUNT = 6;

/**
 * worker的运行状态
 * 0-等待
 * 1-运行中
 */
enum STATE {
  PENDING = 0,
  RUNNING = 1,
}
//队列中的worker类型
type WorksType = {
    id:number
  state: STATE;
  worker: Worker;
};

interface WorkerManagerImp { 
  maxWorkerCount: number; //最大运行数
  Worker: any;            //实际Worker
  works: WorksType[];     //worker队列
  postMessage: (data:any) => Promise<any> //向worker发送请求，并通过Promise接收返回消息
  terminate:() => void      //关闭所有的Worker
}
class WorkerManager implements WorkerManagerImp {
  maxWorkerCount: number;
  Worker: any;
  works: WorksType[] = [];
  constructor(worker: Worker, count = DEFAULT_MAX_WORKER_COUNT) {
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
  /**
   * worker调用规则：先获取未运行状态worker，如果全部都在运行状态，则随机调用worker
   * @param data 
   * @returns 
   */
  postMessage(data: any): Promise<MessageEvent> {
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
