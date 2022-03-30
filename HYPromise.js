const PROMISE_STATUS_PENDING = 'pending';
const PROMISE_STATUS_FULFILLED = 'fulfilled';
const PROMISE_STATUS_REJECTED = 'rejected';
//让reject和resolve不能同时被执行？设置变量status来记录状态
class HYPromise {
    constructor(executor) {
        this.status = PROMISE_STATUS_PENDING;
        //将传递的参数保存下来
        this.value = undefined;
        this.reason = undefined;

        const resolve = (value) => {
            if (this.status === PROMISE_STATUS_PENDING) {
                //设置定时器，避免回调函数在被传入前就被调用,queueMicrotask加入微任务延时调用
                //settimeout是加入宏任务，原生promise是实现的微任务
                this.status = PROMISE_STATUS_FULFILLED;
                queueMicrotask(() => {
                    this.value = value;
                    console.log("resolve被调用");
                    //执行then传递进来的第一个回调函数
                    this.onFulfilled(this.value);
                })

            }
        }

        const reject = (reason) => {
            if (this.status === PROMISE_STATUS_PENDING) {
                this.status = PROMISE_STATUS_REJECTED;
                queueMicrotask(() => {
                    this.reason = reason;
                    console.log("reject被调用");
                    //执行then传递进来的第二个回调函数
                    this.onRejected(this.reason);
                })

            }
        }

        executor(resolve, reject);
    }

    then(onFulfilled, onRejected) {
        this.onFulfilled = onFulfilled;
        this.onRejected = onRejected;
    }
}

const promise = new HYPromise((resolve, reject) => {
    console.log("状态pendding");

    resolve(2222);
    reject(1111);
})

//调用then方法
promise.then(res => {
    console.log("res1:", res);
}, err => {
    console.log("err1:", err);
})