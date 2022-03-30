const PROMISE_STATUS_PENDING = 'pending';
const PROMISE_STATUS_FULFILLED = 'fulfilled';
const PROMISE_STATUS_REJECTED = 'rejected';
//让reject和resolve不能同时被执行？设置变量status来记录状态
class HYPromise {
    constructor(executor) {
        this.status = PROMISE_STATUS_PENDING;
        this.value = undefined;
        this.reason = undefined;

        const resolve = (value) => {
            if (this.status === PROMISE_STATUS_PENDING) {
                this.status = PROMISE_STATUS_FULFILLED;
                this.value = value;
                console.log("resolve被调用");
            }
        }

        const reject = (reason) => {
            if (this.status === PROMISE_STATUS_PENDING) {
                this.status = PROMISE_STATUS_REJECTED;
                this.reason = reason;
                console.log("reject被调用");
            }
        }

        executor(resolve, reject);
    }
}

const promise = new HYPromise((resolve, reject) => {
    console.log("状态pendding");

    reject(1111);
    resolve(2222);
})

// promise.then(res => {

// }, err => {

// })