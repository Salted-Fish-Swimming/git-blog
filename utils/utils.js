const fs = require('fs/promises');

const loadJSON = async (path) => {
  const content = await fs.readFile(path, { encoding: "utf-8" });
  return JSON.parse(content);
};

const saveJSON = async (path, info) => {
  const content = JSON.stringfy(info, null, 2);
  await fs.writeFile(path, content);
};

module.exports =  {
  loadJSON, saveJSON,

  // String => Date | null
  matchTime (str) {
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
  },

  // Date => String
  formatTime (date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    return `${year}-${month}-${day} :> ${hours}:${minutes}:${seconds}`;
  },

}
