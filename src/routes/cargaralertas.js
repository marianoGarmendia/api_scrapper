import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../firebase/firebase.config.js";
import cron from "node-cron";
import { getUrl } from "../server"; // o donde tengas esta función
import { scrapping_cars } from "../mapped_cars"; // tu función de scraping
import {saveCars} from "../routes/management.vehicles.route.js"; // o donde tengas esta función

export const tasks = {}

export const cargarAlertasYProgramar = async () => {
  try {
    const snapshot = await getDocs(collection(firestore, "alerts"));
    snapshot.forEach((doc) => {
      const alerta = doc.data();

      if (!alerta.activa) return; // ignorar alertas desactivadas

      const { hora, minutos, nombreAlerta, marca, modelo, yearDesde, yearHasta, precioDesde, precioHasta } = alerta;

      const cronTime = `${minutos} ${hora} * * *`;

      console.log(`🕒 Reprogramando alerta '${nombreAlerta}' (${doc.id}) para ${cronTime}`);

      const job = cron.schedule(cronTime, async () => {
        console.log(`🚀 Ejecutando alerta '${nombreAlerta}'`);

        try {
          const urlCars = await getUrl({
            modelo,
            marca,
            maxPrice: precioHasta,
            minPrice: precioDesde,
            startYear: yearDesde,
            endYear: yearHasta
          });

          const cars = await scrapping_cars({ url: urlCars, maxPages: 3 });

          console.log(`✅ ${cars.length} autos encontrados para '${nombreAlerta}'`);

          // Opcional: guardar los resultados en la base de datos si querés

          // Tengo que guardar los autos en la base de datos con el id de la alerta
          const saves = await saveCars({alertId: alerta.id, vehicles: cars});
          if (saves) {
            console.log(`✅ ${saves.length} autos guardados para '${nombreAlerta}'`);
          }
          else {
            console.log(`❌ No se pudieron guardar los autos para '${nombreAlerta}'`);
          }


        } catch (error) {
          console.error(`❌ Error ejecutando alerta '${nombreAlerta}':`, error);
        }
      });

      tasks[alerta.id] = job; // Guardar la tarea en un objeto para poder acceder a ella después
    });
  } catch (error) {
    console.error("❌ Error cargando alertas desde la base de datos:", error);
  }
};
