#!/usr/bin/env node
/**
 * Asegura los permisos de las colecciones de Appwrite.
 *
 * Nació de un fallo real: cada usuario podía ver y borrar los datos de los
 * demás. Había dos causas y las dos se arreglan aquí:
 *
 *  1. La colección concedía lectura general (`read("users")` o incluso
 *     `read("any")`). Appwrite **suma** los permisos de la colección a los del
 *     documento, así que ese permiso anulaba el aislamiento por documento: con
 *     `read("users")` cualquier usuario registrado leía todo, y con
 *     `read("any")` lo leía cualquiera sin ni siquiera iniciar sesión.
 *  2. Los documentos se creaban sin permisos propios. Sin `documentSecurity`,
 *     el permiso de la colección era lo único que los hacía visibles, así que no
 *     había forma de distinguir un documento de otro.
 *
 * La configuración correcta es: la colección concede **solo `create`** a los
 * usuarios autenticados (hace falta para poder crear), y cada documento concede
 * leer, actualizar y borrar **solo a su dueño**. Eso lo hace el código de la app
 * al guardar; este script se encarga de la parte del servidor.
 *
 * Es idempotente y solo corrige lo que esté mal. Uso:
 *
 *   AW_KEY=... node scripts/asegurar-permisos.mjs
 *
 * Variables:
 *   AW_ENDPOINT  (por defecto https://fra.cloud.appwrite.io/v1)
 *   AW_PROJECT   id del proyecto de Appwrite
 *   AW_DATABASE  (por defecto recetario)
 *   AW_KEY       clave de API del servidor. Nunca se imprime.
 */

const ENDPOINT = process.env.AW_ENDPOINT ?? "https://fra.cloud.appwrite.io/v1";
const PROJECT = process.env.AW_PROJECT;
const DATABASE = process.env.AW_DATABASE ?? "recetario";
const KEY = process.env.AW_KEY;

if (!KEY || !PROJECT) {
  console.error("Faltan AW_KEY o AW_PROJECT.");
  process.exit(1);
}

const cabeceras = {
  "X-Appwrite-Project": PROJECT,
  "X-Appwrite-Key": KEY,
  "Content-Type": "application/json",
};

/** Solo crear: leer, actualizar y borrar se deciden documento a documento. */
const PERMISOS_COLECCION = ['create("users")'];

const COLECCIONES = [
  { id: "recetas_guardadas", nombre: "Recetas guardadas" },
  { id: "menu_semanal", nombre: "Menu semanal" },
];

async function api(metodo, ruta, cuerpo) {
  const opciones = { method: metodo, headers: cabeceras };
  if (cuerpo !== undefined) opciones.body = JSON.stringify(cuerpo);

  const respuesta = await fetch(`${ENDPOINT}${ruta}`, opciones);
  const texto = await respuesta.text();
  try {
    return texto ? JSON.parse(texto) : {};
  } catch {
    return { message: texto.slice(0, 200) };
  }
}

const esperar = (ms) => new Promise((listo) => setTimeout(listo, ms));

/** Añade el atributo `userId` si falta: es lo que permite filtrar por dueño. */
async function asegurarUserId(coleccionId) {
  const { attributes = [] } = await api(
    "GET",
    `/databases/${DATABASE}/collections/${coleccionId}/attributes`,
  );
  if (!attributes.some((a) => a.key === "userId")) {
    const creado = await api(
      "POST",
      `/databases/${DATABASE}/collections/${coleccionId}/attributes/string`,
      { key: "userId", size: 36, required: false },
    );
    if (creado.message) return `atributo userId: ${creado.message}`;
    console.log("    atributo userId creado");
    for (let intento = 0; intento < 30; intento += 1) {
      await esperar(1000);
      const { attributes: ahora = [] } = await api(
        "GET",
        `/databases/${DATABASE}/collections/${coleccionId}/attributes`,
      );
      if (ahora.find((a) => a.key === "userId")?.status === "available") break;
    }
  }

  const { indexes = [] } = await api(
    "GET",
    `/databases/${DATABASE}/collections/${coleccionId}/indexes`,
  );
  if (!indexes.some((i) => i.key === "userId")) {
    const creado = await api(
      "POST",
      `/databases/${DATABASE}/collections/${coleccionId}/indexes`,
      {
        key: "userId",
        type: "key",
        attributes: ["userId"],
        orders: ["asc"],
      },
    );
    console.log(
      creado.message
        ? `    indice userId: ${creado.message}`
        : "    indice userId creado",
    );
  }
  return null;
}

/** Avisa de documentos que no tengan dueño: serían invisibles o públicos. */
async function revisarDocumentos(coleccionId) {
  const { documents = [], total = 0 } = await api(
    "GET",
    `/databases/${DATABASE}/collections/${coleccionId}/documents`,
  );
  const sinDueno = documents.filter(
    (d) => !(d.$permissions ?? []).some((p) => p.startsWith('read("user:')),
  );
  if (sinDueno.length > 0) {
    console.log(
      `    AVISO: ${sinDueno.length} de ${total} documentos sin dueño. Son invisibles para\n` +
        "    todos, incluido su dueño. Asígnalos antes de seguir.",
    );
  } else if (total > 0) {
    console.log(`    ${total} documentos, todos con dueño`);
  }
  return sinDueno.length;
}

let problemas = 0;

for (const coleccion of COLECCIONES) {
  console.log(`\n${coleccion.id}`);
  const actual = await api(
    "GET",
    `/databases/${DATABASE}/collections/${coleccion.id}`,
  );
  if (actual.message) {
    console.log(`  no se pudo leer: ${actual.message}`);
    problemas += 1;
    continue;
  }

  const permisosActuales = JSON.stringify(actual.$permissions ?? []);
  const permisosCorrectos = JSON.stringify(PERMISOS_COLECCION);

  if (
    permisosActuales === permisosCorrectos &&
    actual.documentSecurity === true
  ) {
    console.log("  permisos de coleccion ya correctos");
  } else {
    const corregida = await api(
      "PUT",
      `/databases/${DATABASE}/collections/${coleccion.id}`,
      {
        name: coleccion.nombre,
        permissions: PERMISOS_COLECCION,
        documentSecurity: true,
        enabled: true,
      },
    );
    if (corregida.message) {
      console.log(`  FALLO al corregir: ${corregida.message}`);
      problemas += 1;
      continue;
    }
    console.log(
      `  permisos corregidos: ${permisosActuales} → ${permisosCorrectos}`,
    );
  }

  const fallo = await asegurarUserId(coleccion.id);
  if (fallo) {
    console.log(`  ${fallo}`);
    problemas += 1;
  }

  problemas += await revisarDocumentos(coleccion.id);
}

console.log(
  problemas === 0
    ? "\nTodo correcto: cada documento lo ve solo su dueño."
    : `\nHay ${problemas} cosas que revisar.`,
);
process.exitCode = problemas === 0 ? 0 : 1;
