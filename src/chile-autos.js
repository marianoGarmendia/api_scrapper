import puppeteer from "puppeteer";
import xlsx from "xlsx";
import PDFdocument from "pdfkit";
import fs from "fs";
import papa from "papaparse";
import { userAgents } from "./userAgents.js";
import yaml from "js-yaml";
import { log } from "console";

// Launch the browser and open a new blank page
export async function scrap() {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--window-size=1920x1080",
    ],
    defaultViewport: null, // Asegúrate de tener una viewport completa
  });
  const page = await browser.newPage();

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });
  });

  // Selecciona un User-Agent aleatorio de la lista
  const randomUserAgent =
    userAgents[Math.floor(Math.random() * userAgents.length)];

  await page.setUserAgent(randomUserAgent);

  // Podria hacer una lógica de acuerdo al search que recibo

  // Navigate the page to a URL.
  await page.goto(
    "https://www.chileautos.cl/vehiculos/autos-veh%C3%ADculo",
    { waitUntil: "networkidle2" }
  );

  let propiedades = [];
  let nextPage = true;
  let i = 0;
  while (nextPage) {
    try {
      await page.waitForSelector(".listing-items", {
        visible: true,
      });
    } catch (error) {
      console.log("Selector no encontrado en el tiempo especificado.");

      // Tomar una captura de pantalla para ver qué está ocurriendo
      await page.screenshot({ path: "screenshot_error.png", fullPage: true });

      // Guardar el contenido de la página

      await browser.close();
      return;
    }
    const arrayProps = await page.evaluate(() => {
      const cards = Array.from(
        document.querySelectorAll(".listing-item")
      );

      console.log(cards);
      
    });

    nextPage = false;

    // Manejo de la paginación *******************************************************************
    // await page.evaluate(() => {
    //   const buttonNext = document.querySelector('[data-qa="PAGING_NEXT"]');
    //   buttonNext.click();
    // });
    // propiedades = [...propiedades, ...arrayProps];
    // i++;
    // if (i == 3) {
    //   nextPage = false;
    // }
    // return propiedades;
  }
  // let props = {};
  // propiedades.forEach((propiedad, i) => {
  //   props[`propiedad: ${i}`] = propiedad;
  // });

  // const yamlData = yaml.dump(props);

  // fs.writeFileSync("propiedades_json.yml", yamlData, "utf8", (err) => {
  //   if (err) {
  //     return console.error("Error al escribir el archivo YAML", err);
  //   }
  //   return console.log("Archivo YAML creado con éxito");
  // });

  // *************** ESCRIBIR EL JSON EN UN ARCHIVO **************
  // const jsonData = JSON.stringify(propiedades, null, 2);
  // fs.writeFile("data_zonaprop.json", jsonData, (err) => {
  //   if (err) {
  //     console.error("Error al escribir el archivo JSON", err);
  //   } else {
  //     console.log("Archivo JSON creado con éxito");
  //   }
  // });

  // ********** GUARDAMOS LOS DATOS EN FORMATO CSV *************
  // const csv = papa.unparse(propiedades);
  // fs.writeFile("props_10_octubre.csv", csv, (err) => {
  //   if (err) {
  //     console.error("Error al escribir el archivo CSV", err);
  //   } else {
  //     console.log("Archivo CSV creado con éxito");
  //   }
  // });

  // const doc = new PDFdocument();
  // doc.pipe(fs.createWriteStream("propiedades.pdf"));

  // propiedades.forEach((propiedad) => {
  //   doc
  //     .fontSize(14)
  //     .text(`El precio es de:${propiedad.price} dólares`, { align: "left" });
  //   doc
  //     .fontSize(12)
  //     .text(`Ubicado en la direccion: ${propiedad.address}`, { align: "left" });
  //   doc
  //     .fontSize(12)
  //     .text(`Las caracteristicas principales son: ${propiedad.features}`, {
  //       align: "left",
  //     });
  // doc
  //   .fontSize(12)
  //   .text(`Descripción de la propiedad: ${propiedad.description}`, {
  //     align: "left",
  //   });
  //   doc
  //     .fontSize(12)
  //     .text(`El Enlace a al portal de la publicación es : ${propiedad.url}`, {
  //       align: "left",
  //     });
  //   doc.fontSize(12).text(`El enlace a la imagen es : ${propiedad.imageUrl}`, {
  //     align: "left",
  //   });
  //   doc.moveDown(2);
  // });

  // doc.end();

  //************* Crear un archivo Excel con los datos ***********
  // const wb = xlsx.utils.book_new();
  // const ws = xlsx.utils.json_to_sheet(propiedades);
  // const path = "propiedadesSinUsd.xlsx";

  // xlsx.utils.book_append_sheet(wb, ws, "Propiedades");
  // xlsx.writeFile(wb, path);
  // console.log("scrapping");
  // await browser.close();
  // PostingTop-sc-i1odl // el div que contiene todo el card
  // LocationAddress-sc-ge2uzh-0 // contiene la direccion
  // data-qa="POSTING_CARD_PRICE" - el precio
  // data-qa="POSTING_CARD_FEATURES" - las caracteristicas
  // data-qa="posting PROPERTY" - La card de la propiedad completa
  // class="flickity-slider" > img > src - la imagen de la propiedad

  // document.querySelector("[data-qa='posting PROPERTY']").dataset.toPosting - la manera de acceder >
  // data-to-posting="/propiedades/clasificado/veclapin-departamento-en-la-plata-53677886.html" - el link a la propiedad - Hay que anteponerle el dominio - https://www.zonaprop.com.ar/
}

scrap();

// // Set screen size.
// await page.setViewport({width: 1080, height: 1024});

// // Type into search box.
// await page.locator('.devsite-search-field').fill('automate beyond recorder');

// // Wait and click on first result.
// await page.locator('.devsite-result-item-link').click();

// // Locate the full title with a unique string.
// const textSelector = await page
//   .locator('text/Customize and automate')
//   .waitHandle();
// const fullTitle = await textSelector?.evaluate(el => el.textContent);

// // Print the full title.
// console.log('The title of this blog post is "%s".', fullTitle);
