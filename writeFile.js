// const {appendFile} = require('node:fs/promises');
import fs from "node:fs/promises";

const writeFile = async (content) => {
  try {
    await fs.appendFile("C:/Users/Admin/Documents/Nodejs/text.txt", content);
  } catch (err) {
    console.log(err);
  }
};

export default writeFile;
