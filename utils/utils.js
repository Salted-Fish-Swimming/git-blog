const fs = require('fs/promises');

module.exports =  {

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


    async loadJSON (path) {
      return JSON.parse(await fs.readFile(
        path, { encoding: "utf-8" }
      ));
    },

    async saveJSON (path, info) {
      await fs.writeFile(
        path, JSON.stringify(info, null, 2)
      );
    },

  }