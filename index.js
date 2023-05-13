const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const { scrollPageToBottom } = require("puppeteer-autoscroll-down");
const fs = require("fs");

puppeteer.use(pluginStealth());
(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--window-size=1920,1080"],
    defaultViewport: null,
  });

  const page = await browser.newPage();

  // 指定網址
  await page.goto("https://shopee.tw/search?keyword=3069&shop=32848838", {
    waitUntil: "domcontentloaded",
  });

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

  const imgItems = await page.evaluate(() => {
    const item = document.querySelector(".inner-contents-area");
    // let data = {};

    let productImg = item.querySelector(".image-left").querySelector("img");

    // items.forEach((e) => {
    //   let img = e.querySelector("img");
    //   let a = e.querySelector("a");

    //   console.log(img, a);
    // });

    return productImg.src;
  });

  const viewSource = await page.goto(imageURL);
  const buffer = await viewSource.buffer();

  // 轉存成json格式
  // fs.writeFileSync("data.json", JSON.stringify(imgItems, null, 2));
  // console.log(imgItems);

  fs.writeFile("image.jpg", buffer, () => {
    console.log("Image downloaded successfully!");
  });

  await browser.close();
})();
