import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const imagesDir = path.join(projectRoot, "public", "images");

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const IMAGES = {
  "hero.jpg":
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&q=80",
  "pollo.jpg":
    "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&q=80",
  "arroz.jpg":
    "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80",
  "pasta.jpg":
    "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80",
  "ensalada.jpg":
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
  "pescado.jpg":
    "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80",
  "carne.jpg":
    "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80",
  "huevo.jpg":
    "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80",
  "postre.jpg":
    "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80",
  "sopa.jpg":
    "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80",
  "verduras.jpg":
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80",
  "legumbres.jpg":
    "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=800&q=80",
  "pollo_limon.jpg":
    "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80",
  "marisco.jpg":
    "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80",
  "pizza.jpg":
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
  "hamburguesa.jpg":
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
  "patatas.jpg":
    "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=800&q=80",
  "queso.jpg":
    "https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=800&q=80",
  "fruta.jpg":
    "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=800&q=80",
  "desayuno.jpg":
    "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80",
  "bebida.jpg":
    "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&q=80",
  "default.jpg":
    "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80",
};

function download(filename, url) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path.join(imagesDir, filename));
    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(
            new Error(
              `Failed to download ${filename}: HTTP ${response.statusCode}`,
            ),
          );
          return;
        }
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(path.join(imagesDir, filename), () => {});
        reject(err);
      });
  });
}

async function run() {
  console.log("Starting images download...");
  for (const [filename, url] of Object.entries(IMAGES)) {
    try {
      await download(filename, url);
      console.log(`✓ Downloaded ${filename}`);
    } catch (err) {
      console.error(`✗ Error downloading ${filename}:`, err.message);
    }
  }
  console.log("All images download check complete.");
}

run();
