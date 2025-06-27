import cors from 'cors';
import fs from 'fs';
import path from 'path';
import ini from 'ini';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);




const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json()); 


const config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));
console.log(config);

 const polygonTypes = ['alert_areas', 'muted_launch_areas', 'active_launch_areas'];

const jsonRelativePath = config.database.json_path;
const polygonsFilePath = path.join(__dirname, jsonRelativePath);


const readPolygonsFromFile = () => {
  try {
    const data = fs.readFileSync(polygonsFilePath, 'utf-8');

    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`קובץ לא נמצא: ${polygonsFilePath}. מחזיר מערך ריק.`);
      return []; // החזר מערך ריק אם הקובץ לא קיים
    }
    console.error('שגיאה בקריאת קובץ הפוליגונים:', error);
    throw new Error('שגיאה בקריאת הפוליגונים מהקובץ');
  }
};

const writePolygonsToFile = (polygons) => {
  try {
    fs.writeFileSync(polygonsFilePath, JSON.stringify(polygons, null, 2), 'utf-8');
  } catch (error) {
    console.error('שגיאה בכתיבת פוליגונים לקובץ:', error);
    throw new Error('שגיאה בכתיבת הפוליגונים לקובץ');
  }
};


app.get('/api/getPolygons', (req, res) => {
  console.log('מנסה לקרוא מנתיב הקובץ:', polygonsFilePath);
  try {
    const polygons = readPolygonsFromFile();
    const filteredPolygons = {
      alert_areas: polygons.alert_areas || [],
      muted_launch_areas: polygons.muted_launch_areas || [],
      active_launch_areas: polygons.active_launch_areas || []
    };

    res.json(filteredPolygons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.post('/api/addPolygon/:type', (req, res) => {
  const { type } = req.params;
  const newPolygon = req.body;
  const conType = type;
  if (!newPolygon || !newPolygon.coordinates || !newPolygon.id) {
    return res.status(400).json({ error: 'חסרים נתונים נדרשים עבור הפוליגון.' });
  }

  if (!polygonTypes.includes(conType)) {
    return res.status(400).json({ error: 'סוג פוליגון לא תקין.' });
  }

  try {
    const polygons = readPolygonsFromFile();
    for (const ptype of polygonTypes) {
      const idExists = polygons[ptype].findIndex(p => p.id === newPolygon.id);      
      if (idExists !== -1) {
        return res.status(400).json({ error: 'כבר קיים פוליגון עם אותו מזהה.' });
      }
    }
    polygons[conType].push(newPolygon); // מוסיף למערך הרלוונטי
    writePolygonsToFile(polygons);

    res.status(201).json({ message: 'הפוליגון נוסף בהצלחה.', polygon: newPolygon });
  } catch (error) {
    console.error('שגיאה בהוספת פוליגון:', error);
    res.status(500).json({ error: 'שגיאה בעת הוספת הפוליגון.' });
  }
});


app.delete('/api/deletePolygon/:id', (req, res) => {
  const polygonId = req.params.id;

  try {
    const polygons = readPolygonsFromFile();
    let deleted = null;

    for (const type of polygonTypes) {
      const index = polygons[type].findIndex(p => p.id === polygonId);
      if (index !== -1) {
        deleted = polygons[type].splice(index, 1)[0];
        break;
      }
    }

    if (!deleted) {
      return res.status(404).json({ error: 'לא נמצא פוליגון עם מזהה כזה באף אזור.' });
    }
    writePolygonsToFile(polygons);
    res.json({ message: 'הפוליגון נמחק בהצלחה.', deleted });

  } catch (error) {
    console.error('שגיאה במחיקה:', error);
    res.status(500).json({ error: 'שגיאה בעת מחיקת הפוליגון.' });
  }
});


app.put('/api/editPolygon/:type/:id', (req, res) => {
  const { type, id } = req.params;
  const { newId } = req.body;

  if (!polygonTypes.includes(type)) {
    return res.status(400).json({ error: 'סוג פוליגון לא חוקי.' });
  }

  try {
    const polygons = readPolygonsFromFile();

    if (!polygons[type]) {
      return res.status(404).json({ error: 'הקטגוריה לא קיימת בקובץ.' });
    }

    const currPolygonIndex = polygons[type].findIndex(p => p.id === id);
    if (currPolygonIndex === -1) {
      return res.status(404).json({ error: 'פוליגון לא נמצא.' });
    }

    if (newId) {
      for (const type of polygonTypes) {
        const index = polygons[type].findIndex(p => p.id === newId);
        if (index !== -1) {
          return res.status(400).json({ error: 'כבר קיים פוליגון עם אותו שם.' });
        }
      }
      polygons[type][currPolygonIndex].id = newId;
    }
    writePolygonsToFile(polygons);
    res.status(200).json({ message: 'השם עודכן בהצלחה.', polygon: polygons[type][currPolygonIndex] });
  } catch (error) {
    console.error('שגיאה בעדכון שם הפוליגון:', error);
    res.status(500).json({ error: 'שגיאה בעת עדכון שם הפוליגון.' });
  }
});


app.listen(PORT, () => {
  console.log(`שרת פועל על http://localhost:${PORT}`);
});