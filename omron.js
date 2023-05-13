const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

(async () => {
  try {
    // 創建資料夾
    const folderPath = path.join(__dirname, "images");
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
      console.log("Folder created successfully!");
    }

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto("https://www.ia.omron.com/product/item/11735/en/");

    const imageURL = await page.evaluate(() => {
      const item = document.querySelector(".inner-contents-area");
      let productImg = item.querySelector(".image-left").querySelector("img");

      return productImg.src;
    });

    const viewSource = await page.goto(imageURL);
    const buffer = await viewSource.buffer();

    const filePath = path.join(folderPath, "image.jpg");
    fs.writeFileSync(filePath, buffer);
    console.log("Image downloaded successfully!");

    await browser.close();
  } catch (error) {
    console.error(error);
  }
})();
