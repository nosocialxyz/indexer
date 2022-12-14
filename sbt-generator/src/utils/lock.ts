const  UNLOCKED  =  0;
const  LOCKED_NO_WAITERS  =  1;
const  LOCKED_POSSIBLE_WAITERS  =  2;
const  NUMINTS  =  1;

export default class Lock {
  private iab: any;
  private ibase: any;
	// 'iab' must be a Int32Array mapping shared memory.
	// 'ibase' must be a valid index in iab, the first of NUMINTS reserved for the lock.
	constructor(iab: any, ibase: number) {
      const x = ibase|0;
		if (!(iab instanceof Int32Array && x === ibase && ibase >= 0 && ibase+NUMINTS <= iab.length)) {
			throw  new  Error(`Bad arguments to Lock constructor: ${iab}  ${ibase}`);
		}
		Atomics.store(iab, ibase, UNLOCKED);
		this.iab = iab;
		this.ibase = ibase;
	}
    /*
	static  initialize(iab: any, ibase: number) {
      const x = ibase|0;
		if (!(iab  instanceof  Int32Array  &&  x === ibase  &&  ibase  >=  0  &&  ibase+NUMINTS  <=  iab.length)) {
			throw  new  Error(`Bad arguments to Lock constructor: ${iab}  ${ibase}`);
		}
		Atomics.store(iab, ibase, UNLOCKED);
		return  ibase;
	}
    */
	// Acquire the lock, or block until we can. Locking is not recursive:
	lock() {
		const  iab  =  this.iab;
		const  stateIdx  =  this.ibase;
		var  c;
		if ((c  =  Atomics.compareExchange(iab, stateIdx, UNLOCKED, LOCKED_NO_WAITERS)) !==  UNLOCKED) { // A
			do {
				if (c  ===  LOCKED_POSSIBLE_WAITERS
				||  Atomics.compareExchange(iab, stateIdx, LOCKED_NO_WAITERS, LOCKED_POSSIBLE_WAITERS) !==  UNLOCKED) {
					Atomics.wait(iab, stateIdx, LOCKED_POSSIBLE_WAITERS, Number.POSITIVE_INFINITY);
				}
			} while ((c  =  Atomics.compareExchange(iab, stateIdx, UNLOCKED, LOCKED_POSSIBLE_WAITERS)) !==  UNLOCKED); // B
		}
	}
	tryLock() {
		const  iab  =  this.iab;
		const  stateIdx  =  this.ibase;
		return  Atomics.compareExchange(iab, stateIdx, UNLOCKED, LOCKED_NO_WAITERS) ===  UNLOCKED;
	}
	unlock() {
		const  iab  =  this.iab;
		const  stateIdx  =  this.ibase;
		var  v0  =  Atomics.sub(iab, stateIdx, 1);
		// Wake up a waiter if there are any
		if (v0  !==  LOCKED_NO_WAITERS) {
			Atomics.store(iab, stateIdx, UNLOCKED);
			Atomics.notify(iab, stateIdx, 1);
		}
	}
	toString() {
		return  "Lock:{ibase:"  +  this.ibase  +"}";
	}
}

/*
export function tryLock(sharedArray: any): boolean {
  //const  sharedBuffer  =  new SharedArrayBuffer(1 * Int32Array.BYTES_PER_ELEMENT);
  //const  sharedArray  =  new  Int32Array(sharedBuffer);
  //Lock.initialize(sharedArray, 0);
  const  lock  =  new  Lock(sharedArray, 0);
  return lock.tryLock();
}
*/
