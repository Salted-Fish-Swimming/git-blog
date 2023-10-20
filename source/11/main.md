# continuation 与不完全 cps 变换

```lisp
(cps c) => (lambda (k) (k c))
(cps (M N)) => (lambda (k) ((cps M) (lambda (m) ((cps N) (lambda (n) (k (m n)))))))
(cps (lambda (x) M)) => (lambda (k x) ((cps M) k))
```
