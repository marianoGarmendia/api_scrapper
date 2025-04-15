import { getUrlCarByYear } from "./utils/get_car_by_urls";
import Playwright, { firefox } from "playwright";
import fs from "fs/promises";
import {config} from "dotenv";
config()

const proxies = {
  server: "brd.superproxy.io:33335",
  username: "brd-customer-hl_7fc79f9b-zone-lacalle_zone",
  password:process.env.BRIGHT_DATA_PASSWORD ,
}; // Ensure this is treated as an object and not invoked

interface AutoData {
  description: string;
  price: string;
  img: string;
  year: string;
  km: string;
  location: string;
  link: string;

  // Agregá más campos si querés
}

export const scrapping_cars = async ({ url, maxPages }) => {
  // Esto deberia ir en una funcion autoejecutable async para funcionar
  const allResults: any = [];
  let currentPage = 1;
  let nextPage = true;

  const browser = await firefox.launch({
    headless: true,
    slowMo: 3000,
    proxy: {
      server: "brd.superproxy.io:33335",
      username: "brd-customer-hl_7fc79f9b-zone-lacalle_zone",
      password: process.env.BRIGHT_DATA_PASSWORD, 
    },
  });
  // const sesion = browser.newBrowserCDPSession()
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

  // Esperar por el selector

  while (nextPage) {
    console.log("Estoy en la pagina: ", currentPage);

    await page.waitForSelector(".listing-item");

    const autosEnPagina = await page.evaluate(() => {
      const cars = document.querySelectorAll(".listing-items .listing-item");
      let carsFound: any[] = [];
      for (let car of cars) {
        const description = car.querySelector(
          'a[data-webm-clickvalue="sv-title"]'
        )?.textContent;

        const link = car.querySelector(
            'a[data-webm-clickvalue="sv-title"]'
          )?.getAttribute("href");
        const price = car.querySelector(
          'a[data-webm-clickvalue="sv-price"]'
        )?.textContent;
        const id = car.getAttribute("id");
        const imgSrc = car
          .querySelector(".carousel-item img")
          ?.getAttribute("src");
        carsFound.push({ description, price, imgSrc , link, id});
      }

      return carsFound;
    });

    console.log(autosEnPagina);

    if (Array.isArray(autosEnPagina) && autosEnPagina.length > 0) {
      allResults.push(...autosEnPagina);
    }

    if (currentPage >= maxPages) {
      break;
    }

    // Busco el boton de nextPage y le hago click
    const nextPageClick = await page.evaluate(() => {
      const nextButton = document.querySelector(
        'nav[aria-label="navigation"] a.page-link.next'
      );
      if (nextButton) {
        console.log('Haciendo click en "Siguiente"');

        
        return true;
        // currentPage++;
      } else {
        console.log(
          'No se encontró el botón de "Siguiente". Fin del scrapping.'
        );
        //  nextPage = false;

        return false;
      }
    });

    if (nextPageClick) {
        await page.click('nav[aria-label="navigation"] a.page-link.next');
        currentPage++;
    } else {
      nextPage = false;
    }
  }

  // Guardar resultados en archivo local
  const filePath = "./autos.json";
  await fs.writeFile(filePath, JSON.stringify(allResults, null, 2), "utf-8");
  console.log(`✅ Datos guardados en: ${filePath}`);

  await browser.close();
  return allResults;
};


