import express from "express";
import cors from "cors";

import multer from "multer";
import {
  getUrlCarByMarcaAndYear,
  getUrlCarByPriceAndYear,
  getUrlCarByYear,
  getFullUrl,
} from "./utils/get_car_by_urls.js";
import { scrapping_cars } from "./mapped_cars.js";
import { cargarAlertasYProgramar } from "./routes/cargaralertas.js";
import { managementVehiclesRouter } from "./routes/management.vehicles.route.js";
import { alertsRouter } from "./routes/alert.routes.js";
import {tasks} from "./routes/cargaralertas.js";
// import { zonaPropRouter } from "./routes/zonaProp.route.js";

console.log("🚀 Iniciando el servidor...");
console.log("Tasks:", tasks);


const PORT = process.env.PORT || 3000;

const app = express();
const upload = multer(); // usa memoria, no archivos

// Configurar CORS
const corsOptions = {
  origin: "https://front-scrapper.onrender.com",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // si usás cookies o auth headers
};

app.use(
  cors(corsOptions)
);

app.options('*', cors(corsOptions));


app.use(express.json());
app.use("/management", managementVehiclesRouter);
app.use("/alerts", alertsRouter);

// app.use("/api", zonaPropRouter);

app.get("/test", (req, res) => {
  res.json({ message: "Todo ok con CORS" });
});

export const getUrl = async ({
  modelo,
  marca,
  maxPrice,
  minPrice,
  startYear,
  endYear,
}:{
  modelo: string;
  marca: string;
  maxPrice: string;
  minPrice: string;
  startYear: string;
  endYear: string;
}) => {
  if (!modelo) {
    const urlCars = getUrlCarByMarcaAndYear({
      marca,
      startYear,
      endYear,
      minPrice,
      maxPrice,
    });
    return urlCars;
  } else {
    const urlCars = getFullUrl({
      marca,
      startYear,
      endYear,
      minPrice,
      maxPrice,
      modelo,
    });
    return urlCars;
  }
};

app.get("/cars", async (req, res) => {
  const { minPrice, maxPrice, marca, startYear, endYear, modelo } =
    req.query as any;
  console.log(req.query);
  try {
    const urlCars = await getUrl({
      modelo,
      marca,
      maxPrice,
      minPrice,
      startYear,
      endYear,
    });
    const cars = await scrapping_cars({ url: urlCars, maxPages: 3 });
    res.json(cars);
    return
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor" });
    return
  }
});


//modificar el endpoint para que reciba un body con los datos de la alerta
// app.post("/schedule-alert", upload.none(), (req, res) => {
//   const {
//     nombreAlerta,
//     horaBusqueda,
//     activa,
//     marca,
//     modelo,
//     añoDesde,
//     añoHasta,
//     precioDesde,
//     precioHasta,
//     fechaInicio,
//   } = req.body;

//   const [hour, minute] = horaBusqueda.split(":").map(Number);

//   // Validación básica
//   if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
//     res.status(400).json({ message: "Datos inválidos" });
//   }

  // const cronTime = `${minute} ${hour} * * *`; // formato cron
  // console.log("Programando cron para:", cronTime);
  // let data = [] as any;
  // cron.schedule(cronTime, async () => {
  //   console.log(`⏰ Ejecutando fetch a las ${hour}:${minute}`);
  //   try {
  //     const urlCars = await getUrl({modelo, marca, maxPrice: precioHasta, minPrice: precioDesde, startYear: añoDesde, endYear: añoHasta})
  //     const cars = await scrapping_cars({ url:urlCars, maxPages: 3 });
  //     return data.push(cars);
  //   } catch (error) {
  //     console.error("❌ Error en el fetch:", error);
  //   }
  // });

//   res.json(data);
// });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

cargarAlertasYProgramar()