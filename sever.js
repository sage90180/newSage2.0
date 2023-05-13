const express = require("express");
const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const { scrollPageToBottom } = require("puppeteer-autoscroll-down");
const fs = require("fs");

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

    // 畫面跑版可以設定參數
    await page.addStyleTag({
      content: "#main{width : 500px;}",
    });

    // 等待指定物件載入
    await page.waitForSelector(".shopee-search-item-result__item");
    await page.waitForSelector("img");

    // 等待頁面載完後下滑
    await scrollPageToBottom(page, {
      size: 500,
      delay: 250,
    });

    const title = await page.evaluate(() => {
      const items = document.querySelectorAll(
        ".shopee-search-item-result__item"
      );
      let data = [];

      items.forEach((e) => {
        let img = e.querySelector("img");
        let a = e.querySelector("a");

        console.log(img, a);
        data.push({
          imgSrc: img.src,
          imgAltL: img.alt,
          hrefL: a.href,
        });
      });

      return data;
    });

    await browser.close();

    res.json({ title });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

// 啟動服務器
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
