async function fullLife (creating, compiling, mounting, lifing, unMounting) {
  console.log('beforeCreate');
  await creating();
  console.log('created');
  await compiling();
  console.log('beforeMount');
  await mounting();
  console.log('mounted');
  await lifing();
  console.log('beforeUnmount');
  await unMounting();
  console.log('unmounted');
}

function gain(fullLife) {
  const handler = [];
  const block = [
    () => (new Promise(res => handler[0] = res)),
    () => (new Promise(res => handler[1] = res)),
    () => (new Promise(res => handler[2] = res)),
    () => (new Promise(res => handler[3] = res)),
    () => (new Promise(res => handler[4] = res)),
  ];
  return [
    () => fullLife(...block),
    () => handler[0](),
    () => handler[1](),
    () => handler[2](),
    () => handler[3](),
    () => handler[4](),
  ]
}

const [f1, f2, f3, f4, f5, f6] = gain(fullLife);

setTimeout(() => {
  f1();
}, 100);
setTimeout(() => {
  f2();
}, 200);
setTimeout(() => {
  f3();
}, 300);
setTimeout(() => {
  f4();
}, 400);
setTimeout(() => {
  f5();
}, 500);
setTimeout(() => {
  f6();
}, 600);
