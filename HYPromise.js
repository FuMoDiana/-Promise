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
            onRejected = onRejected || (err => { throw err });

            /*
            如果在上一个promise中resolve成功了，下一个紧接着是catch(调用rejsct)
            和finally，之前的写法会让catch无法执行，变成undefined，导致finally也无法执行，
            因此，如果onFulfilled不存在，则将上一个promise的value返回出去，直到有resolve的调用。
            */
            onFulfilled = onFulfilled || (value => { return value });
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
        //es6特有方法
    catch (onRejected) {
        //catch也返回一个promise
        return this.then(undefined, onRejected);
    } finally(onFinally) {
        //不管成功还是失败，都调用finally函数
        this.then(() => {
            onFinally();
        }, () => {
            onFinally();
        });
    }
    //实现promise的类方法
    static resolve(value) {
        return new HYPromise((resolve) => (resolve(value)));
    }

    static reject(reason) {
        return new HYPromise((resolve, reject) => { reject(reason) });
    }

    //传入promise数组，全部成功则一起返回。遇到失败则只返回失败部分
    static all(promises) {
            return new HYPromise((resolve, reject) => {
                const values = [];
                promises.forEach(promise => {
                    promise.then(res => {
                        values.push(res);
                        if (values.length === promises.length) {
                            resolve(values);
                        }
                    }, err => {
                        reject(err);
                    })
                })
            })
        }
        //allSettled不执行reject，返回的是promises中所有promise的执行结果和状态（pending/fulfilled/rejected）
    static allSettled(promises) {
        return new HYPromise((resolve) => {
            const results = [];
            promises.forEach(promise => {
                promise.then(res => {
                    results.push({ status: PROMISE_STATUS_FULFILLED, value: res });
                    if (results.length === promises.length) resolve(results);
                }, err => {
                    results.push({ status: PROMISE_STATUS_REJECTED, value: err });
                    if (results.length === promises.length) resolve(results);
                })
            })
        })
    }

    //rece方法,只要有结果就返回，无论reject/resolve
    static race(promises) {
        return new HYPromise((resolve, reject) => {
            promises.forEach(promise => {
                promise.then(res => {
                        resolve(res);
                    }, err => {
                        reject(err);
                    })
                    //promise.then(resolve,reject)与上述代码功能相同
            })
        })
    }

    //any方法:all方法相反
    //reject等所有都reject才执行,且返回一个存放了所有错误信息的类AggreateError(node暂时不支持);
    //有一个resolve就返回。
    static any(promises) {
        return new HYPromise((resolve, reject) => {
            const reasons = [];
            promises.forEach(promise => {
                promise.then(res => {
                    resolve(res);
                }, err => {
                    reasons.push(err);
                    if (reasons.length === promises.length) {
                        reject(new AggregateError(reasons));
                    }
                })
            })
        })
    }

}

const p1 = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve(1111)
    }, 1000)
})
const p2 = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve(2222)
    }, 2000)
})
const p3 = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve(3333)
    }, 300)
})

//race方法测试
HYPromise.any([p1, p2, p3]).then(res => {
    console.log(res);
}).catch(err => {
    console.log(err);
})