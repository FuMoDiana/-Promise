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
        //保证then的多次调用可以实现,将每次传入的回调函数存储起来
        this.onFulfilledFns = [];
        this.onRejectedFns = [];

        const resolve = (value) => {
            if (this.status === PROMISE_STATUS_PENDING) {
                //设置定时器，避免回调函数在被传入前就被调用,queueMicrotask加入微任务延时调用
                //settimeout是加入宏任务，原生promise是实现的微任务
                queueMicrotask(() => {
                    //避免在resolve被回调之前，status已经被改掉的但依然执行solve的情况
                    if (this.status !== PROMISE_STATUS_PENDING) return;
                    this.status = PROMISE_STATUS_FULFILLED;
                    console.log("resolve被调用");
                    //执行then传递进来的第一个回调函数
                    this.onFulfilledFns.forEach(fn => {
                        this.value = value;
                        fn(this.value);
                    })
                })

            }
        }

        const reject = (reason) => {
            if (this.status === PROMISE_STATUS_PENDING) {
                queueMicrotask(() => {
                    if (this.status !== PROMISE_STATUS_PENDING) return;
                    this.status = PROMISE_STATUS_REJECTED;
                    console.log("reject被调用");
                    //执行then传递进来的第二个回调函数
                    this.onRejectedFns.forEach(fn => {
                        this.reason = reason;
                        fn(this.reason)
                    })
                })

            }
        }

        executor(resolve, reject);
    }

    then(onFulfilled, onRejected) {

        //1.如果在then调用时，状态已经确定下来
        if (this.status === PROMISE_STATUS_FULFILLED && onFulfilled) {
            onFulfilled(this.value);
        }
        if (this.status === PROMISE_STATUS_REJECTED && onRejected) {
            onRejected(this.reason);
        }
        //将成功回调和失败回调存入数组中
        this.onFulfilledFns.push(onFulfilled)
        this.onRejectedFns.push(onRejected);

    }
}

const promise = new HYPromise((resolve, reject) => {
    console.log("状态pendding");

    resolve(2222);
    reject(1111);
})

//调用then方法
//实现多次调用
promise.then(res => {
    console.log("res1:", res);
}, err => {
    console.log("err1:", err);
})

promise.then(res => {
    console.log("res2:", res);
}, err => {
    console.log("err2:", err);
})

/*
确定promise状态后
*/

setTimeout(() => {
    promise.then(res => {
        console.log("res3:", res);
    }, err => {
        console.log("err3:", err);
    })
}, 1000);