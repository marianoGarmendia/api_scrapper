// import { PlaywrightWebBaseLoader } from "@langchain/community/document_loaders/web/playwright";

// /**
//  * Loader uses `page.content()`
//  * as default evaluate function
//  **/
// const loader = new PlaywrightWebBaseLoader("https://www.chileautos.cl/vehiculos/autos-veh%C3%ADculo/");

// const docs = await loader.load();
// console.log(docs);

import Playwright , {firefox} from "playwright"




const proxies = {
    server: "brd.superproxy.io:33335",
    username: "brd-customer-hl_7fc79f9b-zone-lacalle_zone",
    password: "5fe08y8qs40y"
};// Ensure this is treated as an object and not invoked


(async(
)=>{

// Esto deberia ir en una funcion autoejecutable async para funcionar
const browser = await firefox.launch({
    headless:false,
    slowMo:3000,
    proxy:{
        server: "brd.superproxy.io:33335",
        username: "brd-customer-hl_7fc79f9b-zone-lacalle_zone",
        password: "5fe08y8qs40y"
    }
})
// const sesion = browser.newBrowserCDPSession()
const context = await browser.newContext({ignoreHTTPSErrors:true})
const page = await context.newPage()
await page.goto("https://www.chileautos.cl/vehiculos/?q=(And.TipoVeh%C3%ADculo.Autos._.Marca.Chevrolet._.Ano.range(2010..2020).)", {waitUntil: "load"})
// await page.locator('div[data-aspect="TipoVehículo"] .heading-text').waitFor();
// await page.locator('div[data-aspect="TipoVehículo"] .heading-text').click();


await page.screenshot({path:"screenshot.png"})
// await browser.close()



})()
