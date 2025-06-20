const fs = require("fs");
const path = require("path");
const scrapeGuildData = require("./scraperGuild");

async function guardarDatosDiarios() {
  const data = await scrapeGuildData();

  if (!data || !data.players || data.players.length === 0) {
    console.error("❌ No se pudo obtener información válida del scraper.");
    return;
  }

  // Fecha actual
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const fecha = `${yyyy}-${mm}-${dd}`;

  const folderPath = path.join(__dirname, "data");
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }

  const filePath = path.join(folderPath, `${fecha}.json`);
  const archivoBaseNombre = "2025-06-14.json"; // archivo base fijo
  const filePathBase = path.join(folderPath, archivoBaseNombre);

  const jugadoresHoy = data.players.map((jugador) => ({
    id: jugador.id,
    name: jugador.name,
    points: Number(jugador.points.replace(/[^0-9]/g, "")),
  }));

  // 1. Si todos tienen 0 puntos hoy, no guardar
  const todosCero = jugadoresHoy.every((j) => j.points === 0);
  if (todosCero) {
    console.log("⚠️ Todos los jugadores tienen 0 puntos. No se guardó archivo.");
    return;
  }

  // 2. Cargar archivo base fijo
  let jugadoresBase = null;
  if (fs.existsSync(filePathBase)) {
    try {
      const rawBase = fs.readFileSync(filePathBase, "utf-8");
      const datosBase = JSON.parse(rawBase);
      jugadoresBase = datosBase.players.map((j) => ({
        id: j.id,
        points: Number(j.points),
      }));
    } catch (err) {
      console.warn("⚠️ Error leyendo archivo base fijo:", err.message);
    }
  } else {
    console.log(`⚠️ Archivo base fijo ${archivoBaseNombre} no encontrado, guardando archivo del día.`);
    guardarArchivo(filePath, fecha, jugadoresHoy);
    return;
  }

  // 3. Ignorar jugadores nuevos o eliminados (comparar solo los comunes)
  const dictBase = {};
  jugadoresBase.forEach((j) => {
    dictBase[j.id] = j.points;
  });

  const jugadoresComunesBase = jugadoresHoy.filter((j) => dictBase.hasOwnProperty(j.id));

  if (jugadoresComunesBase.length === 0) {
    console.log("⚠️ No hay jugadores en común con el archivo base fijo. No se guardó archivo.");
    return;
  }

  const todosIgualesBase = jugadoresComunesBase.every((j) => dictBase[j.id] === j.points);

  if (todosIgualesBase) {
    console.log("ℹ️ Los puntos son iguales al archivo base fijo, temporada no ha comenzado. No se guardó archivo.");
    return;
  }

  // --- NUEVA PARTE: comparar con el último archivo guardado en 'data' para evitar guardar repetidos ---

  // Obtener archivos JSON en la carpeta 'data' excluyendo el archivo de hoy
  const archivos = fs.readdirSync(folderPath)
    .filter(f => f.endsWith(".json") && f !== `${fecha}.json`);

  if (archivos.length > 0) {
    // Ordenar para obtener el archivo más reciente
    const ultimoArchivo = archivos.sort().reverse()[0];
    const filePathUltimo = path.join(folderPath, ultimoArchivo);

    try {
      const rawUltimo = fs.readFileSync(filePathUltimo, "utf-8");
      const datosUltimo = JSON.parse(rawUltimo);
      const jugadoresUltimo = datosUltimo.players.map(j => ({
        id: j.id,
        points: Number(j.points),
      }));

      const dictUltimo = {};
      jugadoresUltimo.forEach(j => {
        dictUltimo[j.id] = j.points;
      });

      const jugadoresComunesUltimo = jugadoresHoy.filter(j => dictUltimo.hasOwnProperty(j.id));

      if (jugadoresComunesUltimo.length > 0) {
        const todosIgualesUltimo = jugadoresComunesUltimo.every(j => dictUltimo[j.id] === j.points);
        if (todosIgualesUltimo) {
          console.log("ℹ️ Los puntos son iguales al último archivo guardado. No se guardó archivo.");
          return;
        }
      }
    } catch (err) {
      console.warn("⚠️ Error leyendo último archivo guardado:", err.message);
      // Si error leyendo último archivo, seguimos para guardar
    }
  }

  // 4. Guardar archivo si pasó todas las verificaciones
  guardarArchivo(filePath, fecha, jugadoresHoy);
}

function guardarArchivo(ruta, fecha, jugadores) {
  fs.writeFileSync(
    ruta,
    JSON.stringify({ date: fecha, players: jugadores }, null, 2)
  );
  console.log(`✅ Datos guardados correctamente: ${ruta}`);
}

module.exports = guardarDatosDiarios;
