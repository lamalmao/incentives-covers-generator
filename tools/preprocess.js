const Jimp = require("jimp");
const pug = require("pug");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const replaceColor = require("replace-color");

const TARGET_COLOR = "#afabab";
const REPLACE_COLOR = "#00000000";

function createPugFunction() {
  const template = pug.compile(
    fs.readFileSync(path.resolve("assets", "blank.pug")),
    {
      filename: path.resolve("assets", "blank.pug"),
    }
  );

  return template;
}

async function getCroppedImage(pathToImage) {
  const image = await Jimp.read(pathToImage);
  return await image.autocrop();
}

async function createTemplate(pathToImage, background, template) {
  const image = await getCroppedImage(pathToImage);
  const bufferImage = await image.getBufferAsync(Jimp.MIME_PNG);

  const data = template({
    image: bufferImage.toString("base64"),
    background,
  });

  const title = crypto.randomBytes(16).toString("hex") + ".html";
  const pathToHTML = path.resolve("temp", title);
  fs.writeFileSync(pathToHTML, data);
  return pathToHTML;
}

async function createTransparentOval(pathToImage, pathToResult) {
  const image = await replaceColor({
    image: pathToImage,
    colors: {
      type: "hex",
      targetColor: TARGET_COLOR,
      replaceColor: REPLACE_COLOR,
    },
    deltaE: 1,
  });

  image.resize(2667, 1500).crop(425, 135, 1800, 1250).write(pathToResult);
}

function mkdirSyncIfNotExists(folder) {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
}

module.exports = {
  mkdirSyncIfNotExists,
  createPugFunction,
  getCroppedImage,
  createTemplate,
  createTransparentOval,
};
