# Algebraic Effects 在 JavaScript 中的一种编译方案

```js
const f = () => {
  let p = flip();
  let q = flip();
  return xor(p, q);
}
```

```js
// k -> ret
const f = ({ flip, ret }) => {
  let p = flip();
  let q = flip();
  return ret(xor(p, q));
}
```

```js
const f = ({ flip, ret }) => {
  return flip(p => {
    return flip(q => {
      return ret(xor(p, q))
    })
  })
}

const f_ = ({ flip, ret }) =>
  flip(p => flip(q => ret(xor(p, q))));
```

Handler

```js
const handle = (eff, handle, h) => eff({ ...h, ...handle });

let xs = handle(f, {
  flip: k => [ ...k(true), ...k(false) ],
  ret: x => [ x] 
});

```

Call Effectful Function

```js
const g = () => {
  let x = f(), y = f();
  return xor(x, y);
}
```

```js
const g = h => {
  const { ret } = h;
  return f({ ...h, ret: x => {
    return f({ ...h, ret: y => {
      return ret(xor(x, y));
    } });
  } });
}
```

```js
const g = (h) => {
  const { ret } = h;
  return f({ ...h, ret: x =>
    f({ ...h, ret: y
      => ret(x, y) })
  });
}
```

Lambda

for if clause

```js
const g = f => f();

const m = ({ e, n, t }) => {
  e();
  g(() => {
    n();
  });
  t();
}
```

```js
const m = h1 => {
  const { e, n, t, ret } = h1;
  return e(() => {
    return g((h2) => {
      const { n, ret2 } = h2;
      return n(() => ret2());
    }, {
      ...h1;
      ret: () => t(() => ret1())
    })
  })
}

const g = (f, h) => {
  const { ret: ret1 } = h;
  return f({ ...h, ret: x => {
    return ret1(x);
  } });
}
```

IF

```js
const If = (b, t, f) => b(t, f);
const True = (t, f) => t();
const False = (t, f) => f();

const and = (b, c) => b(() => c, () => False);
const or = (b, c) => b(() => True, () => c);
const not = b => b(() => False, () => True)
```

```js
const If = (b, t, f) => {
  if (b) {
    return t();
  } else {
    return f();
  }
}
```

```js
const If = (b, t, f, h) => {
  const { ret: ret1 } = h;
  if (b) {
    return t({ ...h, ret: x => ret1(x) });
  } else {
    return f({ ...h, ret: x => ret1(x) });
  }
};
```

```js
const f = () => {
  const c = flip();
  if (c) {
    [ flip(), flip() ];
  } else {
    [ flip() ];
  };
  return g();
}
```

```js
const f = ({ flip: flip1, ret: ret1 }) => {
  return flip1(c => {
    return If(c, ({ flip: flip2, ret: ret2 }) => {
      return flip2(x => flip2(y => ret2([ x, y ])));
    }, ({ ret }) => {
      return flip2(x => ret2([ x ]));
    }, {
      ret: () => g({ ...h, ret: x => ret1(x) }),
    });
  })
}
```
