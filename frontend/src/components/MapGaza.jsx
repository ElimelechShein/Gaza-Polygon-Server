import React, { useEffect, useRef, useState } from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Fill, Stroke, Text } from 'ol/style';
import { Draw, Select } from 'ol/interaction';
import { fromLonLat } from 'ol/proj';
import GeoJSON from 'ol/format/GeoJSON';
import Overlay from 'ol/Overlay';
import useStore from './useStore';
import 'ol/ol.css';
import '../style/style.css';
import axios from 'axios';
import { toast } from 'react-toastify';

const getStyle = (feature) => {

  const status = feature.get('status');
  const name = feature.get('id') || '';
  let color;
  switch (status) {
   
     case 'active_launch_areas': color = 'rgba(255, 0, 0, 0.3)'; break;
    case 'muted_launch_areas': color = 'rgba(45, 43, 43, 0.38)'; break;
    case 'alert_areas': color = 'rgba(0, 0, 255, 0.3)'; break;
    default: color = 'rgba(0, 128, 0, 0.3)';
  }
  return new Style({
    fill: new Fill({ color }),
    stroke: new Stroke({ color: color.replace('0.3', '1'), width: 2 }),
    text: new Text({
      text: name,
      fill: new Fill({ color: '#000' }),
      stroke: new Stroke({ color: '#fff', width: 2 }),
      font: '14px sans-serif',
      offsetY: -10
    })
  });
};

function MapGaza() {
  const mapRef = useRef();
  const popupRef = useRef();
  const { polygons, drawing, setDrawing, addPolygon, polygonStatus, setPolygons, setVectorSourceRef , focusPolygonId, polygonName  } = useStore();
  const [map, setMap] = useState(null);
  const vectorSourceRef = useRef(new VectorSource());
  const vectorLayerRef = useRef(new VectorLayer({ source: vectorSourceRef.current, style: getStyle }));
  useEffect(() => {
  setVectorSourceRef(vectorSourceRef.current);
}, []);
  const drawRef = useRef(null);
  const url = 'http://localhost:5000'
  useEffect(() => {
    if (!mapRef.current) return;
    const baseLayer = new TileLayer({
      source: new XYZ({
        url: '../../public/maps/gaza-tiles/{z}/{x}/{y}.png',
      })
    });
    
    const view = new View({ center: fromLonLat([34.36957121872343, 31.431995239709224]), zoom: 12.59 });
    const newMap = new Map({ target: mapRef.current, layers: [baseLayer, vectorLayerRef.current], view });

    const overlay = new Overlay({ element: popupRef.current, autoPan: true });
    newMap.addOverlay(overlay);


    setMap(newMap);
    return () => newMap.setTarget(undefined);
  }, []);

  // טעינת הפוליגונים הקיימים למפה
  useEffect(() => {
    if (!map) return;
    vectorSourceRef.current.clear();
    const format = new GeoJSON();
    polygons.alert_areas?.forEach((poly) =>{
      const status = 'alert_areas';
       const coords = [...poly.coordinates];
      if (coords[0][0] !== coords.at(-1)[0] || coords[0][1] !== coords.at(-1)[1]) coords.push(coords[0]);
      const feature = format.readFeature({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] }, properties:  { ...poly, status: 'alert_areas' }, }, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' } ,status);
      vectorSourceRef.current.addFeature(feature);
    })
    polygons.muted_launch_areas?.forEach((poly) =>{
       const coords = [...poly.coordinates];
      if (coords[0][0] !== coords.at(-1)[0] || coords[0][1] !== coords.at(-1)[1]) coords.push(coords[0]);
      const feature = format.readFeature({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] }, properties:  { ...poly, status: 'muted_launch_areas' }, }, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' } );
      vectorSourceRef.current.addFeature(feature);                                                    
    
    })
    polygons.active_launch_areas?.forEach((poly) =>{
       const coords = [...poly.coordinates];
      if (coords[0][0] !== coords.at(-1)[0] || coords[0][1] !== coords.at(-1)[1]) coords.push(coords[0]);
      const feature = format.readFeature({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] }, properties:  { ...poly, status: 'active_launch_areas' }, }, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' });
      vectorSourceRef.current.addFeature(feature);
    })
   

  
  }, [polygons, map]);


  // ציור פוליגונים חדשים
  useEffect(() => {
    if (!map) return;
    if (drawRef.current) map.removeInteraction(drawRef.current);

    if (drawing) {
      map.getTargetElement().style.cursor = "url('https://cdn-icons-png.flaticon.com/512/32/32355.png') 4 28, auto";
      const draw = new Draw({ source: vectorSourceRef.current, type: 'Polygon' });

      draw.on('drawend', async (e) => {
        const feature = e.feature;
        const format = new GeoJSON();
        const coords = format.writeFeatureObject(feature, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' }).geometry.coordinates[0];
        
        const newPoly = { 
          id: polygonName,
           name: polygonName,
            status: polygonStatus,
             coordinates: coords 
            };

        const sendNewPoligon = {id : newPoly.name  , coordinates : newPoly.coordinates}
                  feature.setProperties(newPoly);
        addPolygon(newPoly);

        try {
          const res = await axios.post(`${url}/api/addPolygon/${polygonStatus}`, sendNewPoligon);
           toast.success('פוליגון חדש עודכן בהצלחה בשרת! 🎉');
          console.log("פוליגון חדש עודכן בהצלחה בשרת:", res.data);
  
        } catch (error) {
          console.error("שגיאה בשליחת פוליגון חדש לשרת:", error);
           toast.error('שגיאה בשליחת פוליגון חדש לשרת: 😱');
        }

        setDrawing(false);
        map.getTargetElement().style.cursor = '';
      });

      map.addInteraction(draw);
      drawRef.current = draw;
    } else {
      map.getTargetElement().style.cursor = '';
    }
  }, [drawing, polygonStatus]);

  // מיקוד לפוליגון לפי focusPolygonId
  useEffect(() => {
    if (!map || !focusPolygonId) return;
    const feature = vectorSourceRef.current.getFeatures().find(f => f.get('id') === focusPolygonId);
    if (feature) {
      const geometry = feature.getGeometry();
      map.getView().fit(geometry.getExtent(), { duration: 1000, maxZoom: 16 });
    }
  }, [focusPolygonId, map]);

  return (
    <div className="map-container divMapp">
      <div ref={mapRef} style={{ height: '653px', width: '100%' }}></div>
      <div ref={popupRef} className="ol-popup"></div>
    </div>
  );
}

export default MapGaza;



