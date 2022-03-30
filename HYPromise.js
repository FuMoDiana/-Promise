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
        /*
        3.实现then的链式调用：return一个promise,前文中无论是resolve还是reject返回
        的值都是作为以一个promise的resolve，除非是reject中throw了一个err，才会使得下一个
        promise变成reject/catch到 。
        */
        return new HYPromise((resolve, reject) => {
            //1.如果在then调用时，状态已经确定下来
            if (this.status === PROMISE_STATUS_FULFILLED && onFulfilled) {
                try {
                    const value = onFulfilled(this.value);
                    resolve(value);

                } catch (error) {
                    reject(error);
                }
            }
            if (this.status === PROMISE_STATUS_REJECTED && onRejected) {
                try {
                    const reason = onRejected(this.reason);
                    resolve(reason);
                } catch (error) {
                    reject(error);
                }
            }
            /*
            2.将成功回调和失败回调且保存值传入下一个调用的过程函数存入数组中,
            保证每个需要被回调的函数返回的值都保存下来并在下一个promise执行
            */
            this.onFulfilledFns.push(() => {
                try {
                    const value = onFulfilled(this.value);
                    resolve(value);
                } catch (error) {
                    reject(error);
                }
            })
            this.onRejectedFns.push(() => {
                try {
                    const reason = onRejected(this.reason);
                    resolve(reason);
                } catch (err) {
                    reject(err);
                }
            });
        })

    }
}

const promise = new HYPromise((resolve, reject) => {
    //当前promise的resolve的调用值应该是上一个promise的resolve的返回值
    resolve("resolve11111");
    reject("reject11111")
})

//调用then方法，实现链式调用
promise.then(res => {
    console.log("res1:", res);
    //return "第一个promise的resolve的返回值";
    throw new Error("err message");
}, err => {
    console.log("err1:", err);
}).then(res => {
    console.log("res2:", res);
}, err => {
    console.log("err2:", err);
})