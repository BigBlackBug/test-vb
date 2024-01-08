/**
 * Wraps an async class method with a function that will return an in-progress promise,
 * thus ensuring only one instance of the async method is occuring at once.
 * 
 * ex:
 *  class MyClass {
 *    async _myMethod() {
 *      await something()     
 *    }
 *  }

 *  createHeldPromise(MyClass, '_myMethod', 'myMethod')
 *  
 *  const myClassInstance = new MyClass() 
 * 
 *  // Now calling `myMethod` will return the same promise
 *  const firstPromise = myClassInstance.myMethod()
 *  const secondPromise = myClassInstance.myMethod()
 * 
 *  // firstPromise === secondPromise
 * 
 * @param  {Class}   classDefinition  The class to augment
 * @param  {String}  methodName  The name of the method to wrap
 * @param  {String}  wrappedMethodName  The final name of the wrapped method
 * 
 */
// eslint-disable-next-line import/prefer-default-export
export function createHeldPromise(classDefinition, methodName, wrappedMethodName) {
    const promiseName = `_${wrappedMethodName}Promise`;

    // eslint-disable-next-line func-names, no-param-reassign
    classDefinition.prototype[wrappedMethodName] = function(...args) {
        if (!this[promiseName]) {
            this[promiseName] = this[methodName].call(this, ...args);
            this[promiseName].finally(() => {
                this[promiseName] = null;
            });
        }
        return this[promiseName];
    };
}