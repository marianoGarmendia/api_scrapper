import {
  addDoc,
  collection,
  firestore,
  getDocs,
  getDoc,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from "../firebase/firebase.config.js";
import cron from "node-cron";
// cambiar de lugar esta funcion
import { getUrl } from "../server.js";
import { scrapping_cars } from "../mapped_cars.js";
import { tasks } from "./cargaralertas.js";
import { saveCars } from "./management.vehicles.route.js";
import { Router } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
//

export const alertsRouter = Router();
const upload = multer();

alertsRouter.post("/schedule-alert", upload.none(), async (req, res) => {
  const {
    nombreAlerta,
    horaBusqueda,
    activa,
    marca,
    modelo,
    yearDesde,
    yearHasta,
    precioDesde,
    precioHasta,
    fechaInicio,
  } = req.body;

  console.log("Datos recibidos:", req.body);

  const [hour, minute] = horaBusqueda.split(":").map(Number);
  const id_alert = uuidv4(); // Generar un ID único para la alerta

  // Validación básica
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    res.status(400).json({ message: "Datos inválidos" });
    return
  }
  try {
    const result = await addDoc(collection(firestore, "alerts"), {
      nombreAlerta,
      hora: hour,
      minutos: minute,
      activa,
      marca,
      modelo,
      yearDesde,
      yearHasta,
      precioDesde,
      precioHasta,
      fechaInicio,
      id: id_alert, // Generar un ID único para la alerta
    });
    const chile_hour = hour + 1
    const cronTime = `${minute} ${chile_hour} * * *`;
    console.log("Programando cron para:", cronTime);

    const job = cron.schedule(cronTime, async () => {
      console.log(`⏰ Ejecutando fetch a las ${hour}:${minute}`);
      try {
        const urlCars = await getUrl({
          modelo,
          marca,
          maxPrice: precioHasta,
          minPrice: precioDesde,
          startYear: yearDesde,
          endYear: yearHasta,
        });
        const cars = await scrapping_cars({ url: urlCars, maxPages: 3 });

        // solo guardar los cars que no estan guardados ya
        //  const saveCars = await guardarAutosNuevos({cars, alertaId: id})
        const saves = saveCars({ alertId: id_alert, vehicles: cars });
        if (saves) {
          console.log(
            `✅ ${saves.length} autos guardados para '${nombreAlerta}'`
          );
        } else {
          console.log(
            `❌ No se pudieron guardar los autos para '${nombreAlerta}'`
          );
        }

        //  await Promise.all(
        //   cars.map((car) =>
        //     addDoc(collection(firestore, "cars"), {
        //       ...car,
        //       alertaId: id,             // para saber a qué alerta pertenece
        //       fechaCaptura: new Date(),     // opcional: cuándo se ejecutó
        //     })
        //   )
        // );
      } catch (error) {
        console.error("❌ Error en el fetch:", error);
      }
    });

    tasks[id_alert] = job; // Guardar la tarea en un objeto para poder acceder a ella después

    res.status(200).json({ message: "Alerta creada", id: result.id });
    return
  } catch (error) {
    res.status(500).json({ message: error.message });
    return
  }
});

// Obtener los  vehiculos por alertas

const get_cars_by_alert = async ({ id_alert }) => {
  try {
    // Referencia al documento de la colección 'alerts_cars' usando el ID
    const docRef = doc(firestore, "alerts_cars", id_alert);

    // Obtener el documento
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Si el documento existe, devolver los datos (que son un array de objetos)
      const data = docSnap.data(); // Los datos del documento

      return data; // Retorna el array de objetos
    } else {
      console.log("No se encontró el documento con ese ID");
      return null; // Retorna null si no se encuentra el documento
    }
  } catch (e) {
    console.error("Error getting document: ", e);
  }
};

const obtenerAlertaPorId = async (db, alertDocId) => {
  try {
    // Referencia a la colección 'alerts'
    const alertsRef = collection(db, "alerts");

    // Crea una consulta donde el campo 'id' sea igual a '777'
    const q = query(alertsRef, where("id", "==", alertDocId));

    const querySnapshot = await getDocs(q);

   // Verifica si se encontraron documentos
   if (!querySnapshot.empty) {
    // Dado que se espera un único documento, obtenemos el primero
    const docSnapshot = querySnapshot.docs[0];
    // Retorna los datos del documento
    return docSnapshot
    } else {
      console.log(
        "No se encontró ninguna alerta con el document ID proporcionado."
      );
      return null;
    }
  } catch (error) {
    console.error("Error al obtener la alerta:", error);
    throw error;
  }
};

alertsRouter.get("/get-alerts-cars/:id", async (req, res) => {
  const { id } = req.params;
  const { alertPage } = req.query;
  console.log("id", id);
  let alertaData = null;
  try {
    if (alertPage) {
      const alertaDoc = await obtenerAlertaPorId(firestore, id);
      alertaData = alertaDoc.data();

      const cars_by_alert = await get_cars_by_alert({ id_alert: id });
      res.json({ id: alertaDoc.id, ...alertaData, cars: cars_by_alert });
      return;
    }
    // Crear una referencia al documento específico en la colección "alerts"
    const alertaDocRef = doc(firestore, "alerts", id);
    // Obtener el documento
    const alertaDocSnap = await getDoc(alertaDocRef);

    // Verificar si el documento existe
    if (!alertaDocSnap.exists()) {
      res.status(404).json({ message: "Alerta no encontrada" });
      return
    }

    // Obtener los datos del documento
    alertaData = alertaDocSnap.data();

    // Obtener los autos asociados a la alerta
    const cars_by_alert = await get_cars_by_alert({ id_alert: alertaData.id });

    // Construir y enviar la respuesta
     res.json({
      id: alertaDocSnap.id,
      ...alertaData,
      cars: cars_by_alert,
    });
    return
  } catch (error) {
    console.error("❌ Error al obtener la alerta:", error);
     res.status(500).json({ message: "Error del servidor" });
     return
  }
});

alertsRouter.delete("/delete-alert/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Eliminar la alerta de Firestore
    // Obtener todos los documentos de la colección 'alerts'
    const snapshot = await getDocs(collection(firestore, "alerts"));
    // Referencia al documento de la colección 'alerts_cars' usando el ID
    const docRef = doc(firestore, "alerts_cars", id);
    // Buscar el documento que tiene el 'id' en sus datos
    const alertaDoc = snapshot.docs.find((doc) => doc.data().id === id);

    if (!alertaDoc.exists()) {
   res.status(404).json({ message: "Alerta no encontrada" });
   return
    }

    // Detener y eliminar la tarea programada asociada
    if (tasks[id]) {
      tasks[id].stop(); // Detiene la tarea

      delete tasks[id]; // Elimina la referencia en el objeto tasks
      console.log(`Tarea de alerta ${id} cancelada y eliminada`);
    }

    // Borrar la alerta de Firestore
    await deleteDoc(alertaDoc.ref);

    // Borrar la alert_cars vinculada a la alerta de Firestore
    await deleteDoc(docRef);

    res
      .status(200)
      .json({
        message: "Alerta eliminada con éxito",
        alert_name: alertaDoc.data().nombreAlerta,
      });

      return
  } catch (error) {
    console.error("❌ Error al eliminar la alerta:", error);
    res.status(500).json({ message: "Error al eliminar la alerta" });
    return
  }
});

alertsRouter.get("/get-alerts", async (req, res) => {
  try {
    const snapshot = await getDocs(collection(firestore, "alerts"));
    const alerts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ alerts });
    return
  } catch (error) {
    res.status(500).json({ message: error.message });
    return
  }
});
