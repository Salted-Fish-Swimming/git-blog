// 1 + 2 * (3 + 4) + 5
const t = [ '+', [ '+', 1, [ '*', 2, [ '+', 3, 4 ] ] ] , 5 ];

const Fix = (f) => {
  const g = (...args) => f(g)(...args);
  return g;
}

// (t1 -> t2) -> t1 -> t2
const fn1 = fn => t => {
  if (t[0] === '+') {
    return fn(t[1]) + fn(t[2]);
  } else if (t[0] === '*') {
    return fn(t[1]) * fn(t[2]);
  } else {
    return t;
  }
}

const add = (a, b) => a + b;
const times = (a, b) => a * b;

const fn2 = fn => t => {
  if (typeof t === 'object') {
    const [ opcode, t1, t2 ] = t;
    if (opcode === '+') {
      return [ add, fn(t1), fn(t2) ];
    } else if (opcode === '*') {
      return [ times, fn(t1), fn(t2) ];
    }
  } else {
    return t;
  }
};

const fn3 = fn => t => {
   if (typeof t === 'object') {
    const [ op, t1, t2 ] = t;
    return op(fn(t1), fn(t2));
  } else {
    return t;
  }
};

// Fix(fn2 . fn3) = fn2(fn3(Fix(fn2 . fn3)))
// = fn2(fn3(fn2(fn3( ... ... ))))

const fn4 = next => t => {
  if (typeof t === 'object') {
    const [ opcode, t1, t2 ] = t;
    if (opcode === '+') {
      return fn4(st1 => fn4(st2 => next([ add, st1, st2 ]))(t2))(t1)
    } else if (opcode === '*') {
      return fn4(st1 => fn4(st2 => next([ times, st1, st2 ]))(t2))(t1);
    }
  } else {
    return next(t);
  }
}

console.log(fn4(Fix(fn3))(t));
