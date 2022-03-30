//让reject和resolve不能同时被执行？设置变量status来记录状态
const PROMISE_STATUS_PENDING = 'pending';
const PROMISE_STATUS_FULFILLED = 'fulfilled';
const PROMISE_STATUS_REJECTED = 'rejected';

//封装一个工具函数
function execFunctionWithCatchError(execFn, value, resolve, reject) {
    try {
        const result = execFn(value);
        resolve(result);
    } catch (err) {
        reject(err);
    }
}


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
        //如果使用了catch方法，则抛出上一个promise的异常给下一个promise的catch
        onRejected = onRejected || (err => { throw err })
            /*
            3.实现then的链式调用：return一个promise,前文中无论是resolve还是reject返回
            的值都是作为以一个promise的resolve，除非是reject中throw了一个err，才会使得下一个
            promise变成reject/catch到 。
            */
        return new HYPromise((resolve, reject) => {
            //1.如果在then调用时，状态已经确定下来
            if (this.status === PROMISE_STATUS_FULFILLED && onFulfilled) {
                execFunctionWithCatchError(onFulfilled, this.value, resolve, reject);
            }
            if (this.status === PROMISE_STATUS_REJECTED && onRejected) {
                execFunctionWithCatchError(onRejected, this.reason, resolve, reject);
            }
            /*
            2.将成功回调和失败回调且保存值传入下一个调用的过程函数存入数组中,
            保证每个需要被回调的函数返回的值都保存下来并在下一个promise执行
            */
            if (onFulfilled) this.onFulfilledFns.push(() => {;
                execFunctionWithCatchError(onFulfilled, this.value, resolve, reject);
            })
            if (onRejected) this.onRejectedFns.push(() => {
                execFunctionWithCatchError(onRejected, this.reason, resolve, reject);
            });
        })

    }

    catch (onRejected) {
        this.then(undefined, onRejected);
    }
}

const promise = new HYPromise((resolve, reject) => {
    //当前promise的resolve的调用值应该是上一个promise的resolve的返回值
    // resolve("resolve11111");
    reject("reject11111")
})

//调用promise的catch方法
promise.then(res => {
    console.log("res:", res);
    return "123";
}).catch(err => {
    console.log("err:", err);
})