const express = require("express");
const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const { scrollPageToBottom } = require("puppeteer-autoscroll-down");
const fs = require("fs");
const path = require("path");

puppeteer.use(pluginStealth());

const app = express();
const port = 3000;

// 解析 POST 請求的 JSON 資料
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// 處理 POST 請求
app.post("/getTitle", async (req, res) => {
  const { url } = req.body;

  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: ["--window-size=1920,1080"],
      defaultViewport: null,
    });

    const page = await browser.newPage();

    await page.goto(url);

    // // 畫面跑版可以設定參數
    // await page.addStyleTag({
    //   content: "#main{width : 500px;}",
    // });

    // // 等待指定物件載入
    // await page.waitForSelector(".shopee-search-item-result__item");
    // await page.waitForSelector("img");

    // // 等待頁面載完後下滑
    // await scrollPageToBottom(page, {
    //   size: 500,
    //   delay: 250,
    // });

    //擷取圖片
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

    //擷取資料
    const getData = await page.evaluate(() => {
      const data = {};
      data.name = document
        .querySelector(".heading-C01")
        .querySelector("h1").innerText;
      data.subTitle = document.querySelector(".sub-title").innerText;
      data.description = document
        .querySelector(".description")
        .querySelector("h2").innerText;

      data.descriptionTable =
        document.querySelector(".table-blockA01").innerHTML;

      data.tabs = [];
      getTabs = document
        .querySelector(".jsversion")
        .querySelector(".tabs")
        .querySelectorAll("li");
      getTabs.forEach((e) => {
        data.tabs.push(e.querySelector("a").innerText);
      });

      data.mainTables = [];
      getMainTables = document
        .querySelector("#panel01")
        .querySelectorAll("table");

      getMainTables.forEach((e) => {
        data.mainTables.push(e.outerHTML);
      });

      return data;
    });

    // 創建資料夾
    const folderPath = path.join(__dirname, `${getData.name}`);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
      console.log("Folder created successfully!");
    }

    //下載圖片
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      const viewSource = await page.goto(imageUrl);
      const buffer = await viewSource.buffer();

      const filePath = path.join(folderPath, `${getData.name}-${i + 1}.jpg`);
      fs.writeFileSync(filePath, buffer);
      console.log(`Image ${i + 1} downloaded successfully!`);
    }

    // 把資料儲存成json
    fs.writeFileSync(
      path.join(folderPath, `data.json`),
      JSON.stringify(getData, null, 2)
    );

    //  關閉視窗
    await browser.close();

    // 回傳抓到的data
    res.json(getData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

// 啟動服務器
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
