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

/**
 * Añade el atributo `userId` y su índice si faltan.
 *
 * Devuelve un mensaje de problema o `null` si todo está bien. El índice no es
 * opcional: las consultas de la app filtran por `userId` y, sin índice, Appwrite
 * falla, la app se traga el error y devuelve una lista vacía. Es decir, la
 * biblioteca se vería vacía sin ningún aviso.
 */
async function asegurarUserId(coleccionId) {
  const ruta = `/databases/${DATABASE}/collections/${coleccionId}`;
  const { attributes = [] } = await api("GET", `${ruta}/attributes`);

  if (!attributes.some((a) => a.key === "userId")) {
    const creado = await api("POST", `${ruta}/attributes/string`, {
      key: "userId",
      size: 36,
      required: false,
    });
    if (creado.message)
      return `no se pudo crear el atributo userId: ${creado.message}`;

    let disponible = false;
    for (let intento = 0; intento < 30; intento += 1) {
      await esperar(1000);
      const { attributes: ahora = [] } = await api("GET", `${ruta}/attributes`);
      if (ahora.find((a) => a.key === "userId")?.status === "available") {
        disponible = true;
        break;
      }
    }
    if (!disponible) {
      return "el atributo userId no llegó a estar disponible en 30 s";
    }
    console.log("    atributo userId creado");
  }

  const { indexes = [] } = await api("GET", `${ruta}/indexes`);
  if (!indexes.some((i) => i.key === "userId")) {
    const creado = await api("POST", `${ruta}/indexes`, {
      key: "userId",
      type: "key",
      attributes: ["userId"],
      orders: ["asc"],
    });
    if (creado.message)
      return `no se pudo crear el índice userId: ${creado.message}`;
    console.log("    indice userId creado");
  }

  const { indexes: finales = [] } = await api("GET", `${ruta}/indexes`);
  const indice = finales.find((i) => i.key === "userId");
  if (indice?.status !== "available") {
    return `el índice userId no está disponible (estado: ${indice?.status ?? "ausente"})`;
  }
  return null;
}

/**
 * Revisa TODOS los documentos, paginando.
 *
 * Se pagina porque Appwrite devuelve 25 documentos si no se le pide nada: sin
 * paginar, a partir del 26 ninguno se revisaba y el script decía "todo bien".
 *
 * Un documento correcto necesita tres cosas del MISMO usuario (`read`, `update`
 * y `delete`) y que su `userId` sea el de ese dueño. Si le falta el `update` o
 * el `delete`, su dueño lo ve pero no puede moverlo ni borrarlo, y la app se
 * comporta como si no fuera suyo.
 */
async function revisarDocumentos(coleccionId) {
  const ruta = `/databases/${DATABASE}/collections/${coleccionId}/documents`;
  const PAGINA = 100;

  let offset = 0;
  let total = 0;
  let revisados = 0;
  let problemas = 0;

  // Las consultas de Appwrite viajan como JSON: `limit(100)` no es válido aquí.
  const consulta = (metodo, valor) =>
    `queries[]=${encodeURIComponent(JSON.stringify({ method: metodo, values: [valor] }))}`;

  for (;;) {
    const pagina = await api(
      "GET",
      `${ruta}?${consulta("limit", PAGINA)}&${consulta("offset", offset)}`,
    );

    if (pagina.message) {
      console.log(`    no se pudieron leer los documentos: ${pagina.message}`);
      return 1;
    }

    total = pagina.total ?? 0;
    const documentos = pagina.documents ?? [];

    for (const documento of documentos) {
      revisados += 1;
      const permisos = documento.$permissions ?? [];
      const conLectura = permisos.find((permiso) =>
        permiso.startsWith('read("user:'),
      );
      const dueno = conLectura
        ? /user:([^"]+)/.exec(conLectura)?.[1]
        : undefined;

      const completo =
        dueno !== undefined &&
        permisos.includes(`update("user:${dueno}")`) &&
        permisos.includes(`delete("user:${dueno}")`) &&
        documento.userId === dueno;

      if (!completo) {
        problemas += 1;
        console.log(
          `    AVISO: ${documento.$id} no está completo (userId=${documento.userId ?? "vacío"}, ` +
            `permisos=${JSON.stringify(permisos)})`,
        );
      }
    }

    offset += documentos.length;
    if (documentos.length === 0 || offset >= total) break;
  }

  if (problemas === 0 && total > 0) {
    console.log(
      `    ${revisados} de ${total} documentos, todos completos y con su dueño`,
    );
  }
  return problemas;
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
