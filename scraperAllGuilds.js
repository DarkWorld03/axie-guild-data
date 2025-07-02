const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

async function scrapeAllGuilds() {
  try {
    console.log("🔍 Iniciando scrapeAllGuilds...");
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    );

    await page.setExtraHTTPHeaders({
      "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    });

    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (["image", "stylesheet", "font", "media"].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto("https://axieclassic.com/guilds", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    console.log("✅ Página de guilds cargada correctamente.");
    await page.waitForSelector("li.relative.border-b", { timeout: 60000 });

    const guildsData = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("li.relative.border-b")).map((guildItem) => {
        const nameElement = guildItem.querySelector('a[href^="/guilds/"] h2');
        const urlElement = guildItem.querySelector('a[href^="/guilds/"]');
        const imgElement = guildItem.querySelector("img");
        const pointsElement = guildItem.querySelector("div.flex.w-16.shrink-0.flex-col.md\\:w-40.md\\:flex-row div:nth-child(2) div span");

        if (!nameElement || !urlElement || !imgElement || !pointsElement) return null;

        const name = nameElement.innerText.trim();
        const url = `https://axieclassic.com${urlElement.getAttribute("href")}`;
        const logo = imgElement.src;
        const points = pointsElement.innerText.trim().replace(",", "");

        return { name, url, logo, points };
      }).filter(guild => guild !== null);
    });

    console.log("✅ Datos extraídos correctamente.");
    await browser.close();
    return guildsData;
  } catch (error) {
    console.error("❌ Error en `scraperAllGuilds.js`:", error);
    return [];
  }
}

module.exports = scrapeAllGuilds;
