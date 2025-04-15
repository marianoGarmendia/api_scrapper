import {
  addDoc,
  collection,
  firestore,
  getDocs,
  getDoc,
  query,
  where,
  doc,  
  setDoc,
  updateDoc,
  deleteDoc
} from "../firebase/firebase.config.js";
import { Router } from "express";

export const managementVehiclesRouter = Router();



// Guardar autos por alerta id 
export const saveCars = async ({ alertId, vehicles }) => {
  try {
    const alertDocRef = doc(firestore, "alerts_cars", alertId);
    const alertDocSnapshot = await getDoc(alertDocRef);

    let existingVehicles = [];
    if (alertDocSnapshot.exists()) {
      const alertData = alertDocSnapshot.data();
      existingVehicles = alertData.cars || [];
    }

    const existingVehicleMap = new Map(
      existingVehicles.map((v) => [v.id, v])
    );

   

    const updatedVehicles = vehicles.map((vehicle) => {
      const exists = existingVehicleMap.has(vehicle.id);

      return {
        ...vehicle,
        nuevo: !exists
        
      };
    });

    // 🔁 Mezclamos actualizados y eliminamos duplicados (por ID)
    const mergedVehicleMap = new Map();

    [...existingVehicles, ...updatedVehicles].forEach((v) => {
      mergedVehicleMap.set(v.id, v);
    });

    const finalVehicles = Array.from(mergedVehicleMap.values());

    if (alertDocSnapshot.exists()) {
      await updateDoc(alertDocRef, {
        cars: finalVehicles,
      });
    } else {
      await setDoc(alertDocRef, {
        cars: finalVehicles,
      });
    }

    console.log("🚗 Vehículos actualizados correctamente.");
    return true;
  } catch (e) {
    console.error("❌ Error al procesar los vehículos: ", e);
    return false;
  }
};

const get_cars = async () => {
  try {
    const cars = [];
    const querySnapshot = await getDocs(collection(firestore, "cars"));
    querySnapshot.forEach((doc) => {
      cars.push(doc.data());
    });
    console.log("get cars", cars);
    
    return cars;
  } catch (e) {
    console.error("Error getting document: ", e);
  }
};





  // Función para obtener un vehículo por su campo 'id'
// async function update_cars({alertId, vehiculoId ,update , toDelete}) {
//   try {
//     // Crear una consulta a la colección 'vehiculos' donde el campo 'id' sea igual a vehiculoId

//     const q = query(collection(firestore, 'cars'), where('id', '==', vehiculoId));
//     const querySnapshot = await getDocs(q);

//     if (!querySnapshot.empty) {
//       // Si hay resultados, asumimos que el primer documento es el que buscamos
//       const vehiculoDoc = querySnapshot.docs[0];
//       const vehiculoRef = doc(firestore, 'cars', vehiculoDoc.id);
//       // Actualizar el campo 'isContacted' , "isFavorite" o eliminar
//       if(toDelete){
//         // Eliminar el documento
//       await deleteDoc(vehiculoRef);
//       console.log('Vehículo encontrado y eliminado:', vehiculoRef);
//       return vehiculoRef
//       }else{
//         await updateDoc(vehiculoRef, {
//           ...update
//         });
//         console.log('Vehículo encontrado y actualizado:', vehiculoRef);
//         return vehiculoRef;

//       }
      
//     } else {
//       console.log('No se encontró ningún vehículo con el ID proporcionado.');
//       return null;
//     }
//   } catch (error) {
//     console.error('Error al obtener el vehículo:', error);
//     throw error;
//   }
// }

// Funcion para actualizar los campos de un vehiculo por su id 
// y el id de la alerta
export async function update_fields_cars({alertId, vehiculoId ,update}) {
  const alertDocRef = doc(firestore, "alerts_cars", alertId);

  try {
    const alertDocSnapshot = await getDoc(alertDocRef);

    if (!alertDocSnapshot.exists()) {
      console.log("No se encontró la alerta con el ID proporcionado.");
      return;
    }

    const alertData = alertDocSnapshot.data();
    const cars = alertData.cars || [];

    const carIndex = cars.findIndex(car => car.id === vehiculoId);

    if (carIndex === -1) {
      console.log("No se encontró el vehículo con el ID proporcionado en esta alerta.");
      return;
    }
    Object.keys(update).forEach(
      (key) => update[key] === undefined && delete update[key]
    );
    // Actualizar el objeto específico en el array
    cars[carIndex] = { ...cars[carIndex], ...update };

    // Actualizar el documento en Firestore con el array modificado
    await updateDoc(alertDocRef, { cars });

    console.log("Vehículo actualizado correctamente.");
  } catch (error) {
    console.error("Error al actualizar el vehículo: ", error);
  }
}

export async function deleteCarFromAlert({ alertId, vehiculoId }) {
  const alertDocRef = doc(firestore, "alerts_cars", alertId);

  try {
    const alertDocSnapshot = await getDoc(alertDocRef);

    if (!alertDocSnapshot.exists()) {
      console.log("No se encontró la alerta con el ID proporcionado.");
      return;
    }

    const alertData = alertDocSnapshot.data();
    const cars = alertData.cars || [];

    // Filtrar el array para excluir el vehículo con el vehiculoId proporcionado
    const updatedCars = cars.filter(car => car.id !== vehiculoId);

    // Actualizar el documento en Firestore con el array modificado
    await updateDoc(alertDocRef, { cars: updatedCars });

    console.log("Vehículo eliminado correctamente.");
  } catch (error) {
    console.error("Error al eliminar el vehículo: ", error);
  }
}


managementVehiclesRouter.post("/vehicles/update/:id", async (req, res) => {
  const {id} = req.params
  const { isContacted , isFavorite , contactCel , comment , alertId} = req.body;
  console.log(contactCel);
  console.log(comment);
  console.log(isContacted);
  console.log(isFavorite);
  
  try {
    const vehiculo = await update_fields_cars({ alertId , vehiculoId: id, update: { isContacted, isFavorite , contactCel , comment} });
    res.json({ vehiculo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})

managementVehiclesRouter.delete("/vehicles/delete/:id", async (req, res) => {
  const {id } = req.params
  const { alertId } = req.query;

  console.log(id);
  console.log(alertId);
  
  try {
    const vehiculo = await deleteCarFromAlert({ alertId:alertId,vehiculoId: id });
    res.json({ vehiculo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})



// managementVehiclesRouter.post("/vehicles/save", async (req, res) => {
//   try {
//     const { vehicles } = req.body;
//     if (!Array.isArray(vehicles)) {
//       return res.status(400).json({ message: "Invalid vehicles format" });
//     }
//     const saveCars = await saveCars(vehicles);
//     console.dir(vehicles, { depth: null });

//     if (saveCars) {
//       return res.json({ message: "Cars saved successfully" });
//     } else {
//       return res.status(500).send({ message: "Error saving cars" });
//     }
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

managementVehiclesRouter.get("/vehicles/get", async (req, res) => {
  try {
    const cars = await get_cars();
    res.json({ cars });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

managementVehiclesRouter.get('/vehicles/groups-brand', async (req, res) => {
  try {
    const alertsSnapshot = await getDocs(collection(firestore, "alerts"));
    const results = [];

    for (const alertDoc of alertsSnapshot.docs) {
      const alertData = alertDoc.data();
      const { marca, nombreAlerta } = alertData;
      const id = alertDoc.id;

      // Referencia al documento en 'alerts_cars' correspondiente al 'id'
      const alertCarsDoc = doc(firestore, "alert", id);
      // const alertCarsDoc = await alertCarsRef.get();

      let arrayLength = 0;
      if (alertCarsDoc.exists) {
        const alertCarsData = alertCarsDoc.data();
        // Suponiendo que el array que deseas medir se llama 'cars'
        arrayLength = alertCarsData.cars ? alertCarsData.cars.length : 0;
      }

      results.push({ id, marca, nombreAlerta, arrayLength });
    }

    res.status(200).json(results);
  } catch (error) {
    console.error('Error al obtener datos:', error);
    res.status(500).json({ message: 'Error al obtener datos', error: error.message });
  }
});

