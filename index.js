const fs = require("fs/promises");

const argv = process.argv.slice(2);
const infoPath = "./info/info.json";

async function loadJSON (path) {
  return JSON.parse(await fs.readFile(
    path, { encoding: "utf-8" }
  ));
}

async function saveJSON (path, info) {
  await fs.writeFile(
    path, JSON.stringify(info, null, 2)
  );
}

// String => Date | null;
function matchTime (str) {
  let match = str.match(/(\d+)-(\d+)-(\d+) :> (\d+):(\d+):(\d+)/);
  if (match !== null) {
    const [year, month, day, hour, minute, second] = match.slice(1).map(Number);
    return new Date(year, month - 1, day, hour, minute, second);
  }
  match = str.match(/(\d+)-(\d+)-(\d+)/);
  if (match !== null) {
    const [year, month, day] = match.slice(1).map(Number);
    return new Date(year, month - 1, day);
  }
  return null;
}

// Date => String
function formatTime (date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  return `${year}-${month}-${day} :> ${hours}:${minutes}:${seconds}`;
}

(async function main () {
  const info = await loadJSON(infoPath);

  const type = argv[0];

  if (type === '-new') {
    const title = argv[1] ?? "题目";
    newBlog(title, info, async () => {
      info.blog.number += 1;
      saveJSON(infoPath, info);
    });
  }
})();

async function newBlog (title, info, success) {
  const { blog: { number } } = info;

  const fileContent = `# ${title}`;
  const filePath = `./blog/${number + 1}/`;

  console.log(filePath);

  // await fs.mkdir(filePath);
  await fs.writeFile(
    `${filePath}/blog.md`,fileContent, { encoding: "utf-8"}
  );

  saveJSON(`${filePath}/info.json`, {
    title,
    "create-time": formatTime(new Date()),
    "update-time": formatTime(new Date()),
  });
}