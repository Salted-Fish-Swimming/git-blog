const markdown = require('./utils/markdown');

const { checkBlog, newBlog } = require('./utils/blog');
const { loadJSON, saveJSON } = require('./utils/utils');

const config = {
  blogPath: "./blog",
  infoPath: "./info/info.json"
};

const argv = process.argv.slice(2);

(async function main () {

  const info = await loadJSON(config.infoPath);

  const type = argv[0];

  await checkBlog(config, info);

  if (type === '-new') {
    const title = argv[1] ?? "题目";
    await newBlog(title, info, async () => {
      info.blog.number += 1;
      saveInfo(info);
    });
  } else if (type === '-check') {
  }
})();
