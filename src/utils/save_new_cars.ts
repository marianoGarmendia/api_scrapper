import { collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { firestore } from "../firebase/firebase.config";

export const guardarAutosNuevos = async ({cars, alertaId}) => {
  try {
    const carsRef = collection(firestore, "cars");

    // 1. Obtener todos los IDs existentes
    const snapshot = await getDocs(carsRef);
    const idsExistentes = new Set();
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.id) idsExistentes.add(data.id);
    });

    // 2. Filtrar solo los autos nuevos
    const autosNuevos = cars.filter((car) => !idsExistentes.has(car.id));

    if (autosNuevos.length === 0) {
      console.log("📭 No hay autos nuevos para guardar.");
      return;
    }

    // 3. Guardar autos nuevos
    await Promise.all(
      autosNuevos.map((car) =>
        addDoc(carsRef, {
          ...car,
          alertaId,
          fechaCaptura: new Date(),
        })
      )
    );
    console.log(`✅ Se guardaron ${autosNuevos.length} autos nuevos.`);
    return true
  } catch (error) {
    console.error("❌ Error al guardar autos nuevos:", error);
    return false
  }
};
