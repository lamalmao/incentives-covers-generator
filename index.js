const {
  createTemplate,
  createPugFunction,
  createTransparentOval,
  mkdirSyncIfNotExists,
} = require("./tools/preprocess");
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");

(async () => {
  try {
    const resultsPath = path.resolve("results");
    const draftsPath = path.resolve("drafts");
    mkdirSyncIfNotExists(resultsPath);
    mkdirSyncIfNotExists(draftsPath);

    const background = "data:image/png;base64, ".concat(
      fs
        .readFileSync(path.resolve("assets", "background.png"))
        .toString("base64")
    );
    const template = createPugFunction();

    const browser = await puppeteer.launch({
      headless: true,
    });

    const incentives = fs.readdirSync(path.resolve("files"));
    for (const incentive of incentives) {
      const raw = /(?<group>\w+)-(?<tag>\w+)/.exec(incentive);
      if (!raw) {
        continue;
      }

      const { group, tag } = raw.groups;
      console.log(`Parsing ${group}...`);

      const groupPath = path.resolve(resultsPath, group);
      const groupDraftsPath = path.resolve(draftsPath, group);
      mkdirSyncIfNotExists(groupPath);
      mkdirSyncIfNotExists(groupDraftsPath);

      const images = fs.readdirSync(path.resolve("files", incentive));
      let counter = 1;
      for (const image of images) {
        if (!["jpg", "png", "PNG", "jpeg", "JPG"].includes(image.slice(-3))) {
          continue;
        }
        const pathToImage = path.resolve("files", incentive, image);
        const pathToIncentiveTemplate = await createTemplate(
          pathToImage,
          background,
          template
        );

        const page = await browser.newPage();
        await page.goto(pathToIncentiveTemplate);
        await page.waitForSelector(".cover");
        const element = await page.$(".cover");

        if (!element) {
          await page.close();
          continue;
        }

        const title = `${tag}${counter}.png`;

        const preset = await element.screenshot();
        const pathToPreset = path.resolve(groupDraftsPath, title);
        fs.writeFileSync(pathToPreset, preset);
        await page.close();
        fs.rmSync(pathToIncentiveTemplate);

        const resultPath = path.resolve(groupPath, title);
        await createTransparentOval(pathToPreset, resultPath);

        counter++;
      }
    }
  } catch (error) {
    console.log(error);
  }
})();
