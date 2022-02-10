module.exports = function (strings, ...keys) {
  const content = String.raw(strings, keys);
  let lines = content.split('\n');

  if (lines.length === 0) {
    return "";
  }

  lines = lines.splice(1); // 删掉第一行

  // 生成正则
  const space = lines[0].match(/\s*/)[0];
  const r = RegExp(`^${space}`);
  // 消除缩进
  lines = lines.map((line) => {
    return line.replace(r, '');
  });

  return lines.join('\n');
}