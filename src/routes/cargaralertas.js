import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../firebase/firebase.config.js";
import cron from "node-cron";
import { getUrl } from "../server.js"; // o donde tengas esta función
import { scrapping_cars } from "../mapped_cars.js"; // tu función de scraping
import {saveCars} from "../routes/management.vehicles.route.js"; // o donde tengas esta función

export const tasks = {}

export const cargarAlertasYProgramar = async () => {
  try {
    const snapshot = await getDocs(collection(firestore, "alerts"));
    snapshot.forEach((doc) => {
      const alerta = doc.data();

      if (!alerta.activa) return; // ignorar alertas desactivadas

      const { hora, minutos, nombreAlerta, marca, modelo, yearDesde, yearHasta, precioDesde, precioHasta } = alerta;
      const chile_hour = hora === 0 ? 23 : hora - 1

      const cronTime = `${minutos} ${chile_hour} * * *`;

      const executeAlert = shouldRunAlert(hora, minutos) 
      if(executeAlert){
        const executeAlertFc = async () => {
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
          const saves = await saveCars({alertId: alerta.id, vehicles: cars});
          if (saves) {
            console.log(`✅ ${saves.length} autos guardados para '${nombreAlerta}'`);
          }
          else {
            console.log(`❌ No se pudieron guardar los autos para '${nombreAlerta}'`);
          }
          
        }
        executeAlertFc()
        return
      }
      
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


// Función que valida si la hora actual está dentro de los 30 minutos previos a la hora programada
function shouldRunAlert(targetHour, targetMinute) {
  const ahora = new Date();
  const opciones = { timeZone: 'America/Santiago', hour12: false };
  const horaActual = new Intl.DateTimeFormat('es-CL', { ...opciones, hour: '2-digit' }).format(ahora);
  const minutosActuales = new Intl.DateTimeFormat('es-CL', { ...opciones, minute: '2-digit' }).format(ahora);

  const nowMinutes = parseInt(horaActual, 10) * 60 + parseInt(minutosActuales, 10);
  const targetMinutes = targetHour * 60 + targetMinute;

  const diff = nowMinutes - targetMinutes;

  return diff >= -30 && diff <= 0;
}

cron.schedule('*/30 * * * *', () => {
  console.log('Verificando alertas cada 30 minutos...');
  cargarAlertasYProgramar(); // Llama a la función para cargar y programar alertas

});

// // Ejemplo de uso
// const targetHour = 17; // Hora programada
// const targetMinute = 27; // Minuto programado

// if (shouldRunAlert(targetHour, targetMinute)) {
//  return true // Ejecuta la función si está dentro del rango
  
// } else {
//   console.log('⏳ Fuera del rango de ejecución. No se ejecuta get_cars().');
//   return false
// }
