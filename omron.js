const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto("https://www.ia.omron.com/product/item/11735/en/");

    const imageUrls = await page.evaluate(() => {
      let imgData = [];
      const item = document.querySelector(".inner-contents-area");
      // 取得產品照片
      let productImgs = item.querySelectorAll("img");

      productImgs.forEach((e) => {
        if (
          !e.classList.contains("iconA01") &&
          !e.parentNode.classList.contains("print-preview")
        ) {
          imgData.push(e.src);
        }
      });

      return imgData;
    });

    const getData = await page.evaluate(() => {
      const data = {};
      data.name = document
        .querySelector(".heading-C01")
        .querySelector("h1").innerText;
      data.subTitle = document.querySelector(".sub-title").innerText;
      data.description = document
        .querySelector(".description")
        .querySelector("h2").innerText;
      data.tabs = [];
      getTabs = document
        .querySelector(".jsversion")
        .querySelector(".tabs")
        .querySelectorAll("li");
      getTabs.forEach((e) => {
        data.tabs.push(e.querySelector("a").innerText);
      });
      data.descriptionTable =
        document.querySelector(".table-blockA01").innerHTML;

      return data;
    });

    // 創建資料夾
    const folderPath = path.join(__dirname, `${getData.name}`);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
      console.log("Folder created successfully!");
    }

    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      const viewSource = await page.goto(imageUrl);
      const buffer = await viewSource.buffer();

      const filePath = path.join(folderPath, `${getData.name}-${i + 1}.jpg`);
      fs.writeFileSync(filePath, buffer);
      console.log(`Image ${i + 1} downloaded successfully!`);
    }

    fs.writeFileSync(
      path.join(folderPath, `data.json`),
      JSON.stringify(getData, null, 2)
    );

    await browser.close();
  } catch (error) {
    console.error(error);
  }
})();
