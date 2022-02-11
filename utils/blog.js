const fs = require('fs/promises');

const { loadJSON, saveJSON, formatTime } = require('./utils');
const Markdown = require('./markdown');

function isNumber (value) {
  return !isNaN(value)
}

module.exports = {

  async newBlog (title, config, info, success) {
    const { blog: { number } } = info;
    const { blogPath } = config;

    const fileContent = `# ${title}`;
    const filePath = `${blogPath}/${number + 1}/`;

    console.log(filePath);

    await fs.mkdir(filePath);
    await fs.writeFile(
      `${filePath}/blog.md`,fileContent, { encoding: "utf-8"}
    );

    saveJSON(`${filePath}/info.json`, {
      title,
      "create-time": formatTime(new Date()),
      "update-time": formatTime(new Date()),
    });

    await success();
  },

  async checkBlog (config, info, success) {
    const { blogPath: path } = config;

    // 文件夹排序重命名
    const rawDirs = await fs.readdir(path, { encoding: 'utf-8' });
    const processDirs = rawDirs.map(Number).filter(Number.isInteger).sort();
    const taskInfo = processDirs.map((v, i) => [v, v - i]);
    if (!taskInfo.reduce((p, c) => p && c[1] !== 1)) {
      await Promise.all(
        taskInfo
          .filter(([rawName, diff]) => diff > 1)
          .map(([rawName, diff]) => {
            const oldName = `${path}/${rawName}`;
            const newName = `${path}/${rawName - diff + 1}`;
            return fs.rename(oldName, newName);
          })
      )
    }

    const newDirs = await fs.readdir(path, { encoding: 'utf-8' });

    await Promise.allSettled(newDirs
      .map((subPath) => `${path}/${subPath}`)
      .map(async (path) => {
        const content = await fs.readFile(`${path}/blog.md`, { encoding: 'utf-8' });
        const md = Markdown.parse(content);
        const mdInfo = await loadJSON(`${path}/info.json`);

        // 检查标题更新
        if (mdInfo.title != md.title()) {
          mdInfo.title = md.title();
          mdInfo['update-time'] = formatTime(new Date());
          await saveJSON(`${path}/info.json`, mdInfo);
        }
      })
    );
  },

  async updateBlog (options, config, info, success) {
    
  },
};