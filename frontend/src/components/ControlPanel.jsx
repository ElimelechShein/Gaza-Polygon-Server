import React, { useEffect, useState } from 'react';
import '../style/style.css';
import axios from 'axios';
import useStore from './useStore';
import jsonPoly from '../../gaza_polygons.json'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { toast, ToastContainer } from 'react-toastify';
function ControlPanel() {
  const url = 'http://localhost:5000'
  const {
    setPolygons,
    setDrawing,
    setPolygonStatus,
    setFocusPolygonId,
    removePolygon,
    polygons,
    vectorSourceRef,
    setPolygonName,
  } = useStore();

  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [tempStatus, setTempStatus] = useState(null);
  const [openDialogDelit, setopenDialogDelit] = useState(false);
  const [polygonID, setPolygonID] = useState(false)



  const [alertIds, setAlertIds] = useState([])
  const [mutedIds, setMutedIds] = useState([])
  const [activeIds, setActiveIds] = useState([])



  useEffect(() => {
    const loadPolygons = async () => {
      try {
        const res = await axios.get(`${url}/api/getPolygons`);
 
        setPolygons(res.data);

      } catch (error) {
        console.error('שגיאה בטעינת פוליגונים:', error);
       toast.error(' שגיאה בטעינת פוליגונים ! 😱');
      }
    };
    loadPolygons();
  }, [setPolygons]);

  const handleDrawClick = (status) => {
    setTempStatus(status);
    setShowNamePrompt(true);
  };

  const confirmPolygonName = () => {
    const nameInput = document.getElementById('polygon-name-input');
    const name = nameInput?.value?.trim() || 'פוליגון חדש';
    setPolygonStatus(tempStatus);
    setPolygonName(name);
    setDrawing(true);
    setShowNamePrompt(false);
  };

  const delitPoligon = (polyID) => {
    setopenDialogDelit(true);
    setPolygonID(polyID)
  }


  const remuvPolygonState = (eventPoly) => {

    const futshers = vectorSourceRef.getFeatures()
    console.log(futshers)
    const removePoly = futshers.find((f) => f.get('id') === eventPoly)
    if (removePoly) {
      vectorSourceRef.removeFeature(removePoly)
    
    }
      
useStore.getState().removePolygon(eventPoly);

  


  }
  const delitPoligonOk = (polyID) => {
    setopenDialogDelit(false);

    const DelitPolyOk = async () => {
  
      try {
        const respons = await axios.delete(`${url}/api/deletePolygon/${polyID}`)

        remuvPolygonState(polyID)


        console.log('הפוליגון נמחק בהצלחה ', respons.data)
        toast.success('הפוליגון נמחק בהצלחה ! 🎉');

      } catch (error) {
        console.log('שגיאה במחיקת הפוליגון ', error)
    
      toast.error('שגיאה במחיקת הפוליגון  😱');
      }
    }
    DelitPolyOk()




    setPolygonID('')
  }

  useEffect(() => {
    setAlertIds(polygons.alert_areas.map(alertArea => alertArea.id))
    setMutedIds(polygons.muted_launch_areas.map(alertArea => alertArea.id))
    setActiveIds(polygons.active_launch_areas.map(alertArea => alertArea.id))
    console.log({ polygons })
  }, [polygons])


  return (
    <div className="d-flex flex-column h-100 bg-dark text-light p-3 rounded controlColor">
      <div className="mb-4">
        <h2 className="fs-5 border-bottom border-secondary pb-2 mb-3 section-title-override">צור פוליגון</h2>
        <div className="d-flex flex-wrap gap-2 button-group-override">
          <button className="btn btn-primary panel-button" onClick={() => handleDrawClick('alert_areas')}>התרעה</button>
          <button className="btn btn-secondary panel-button" onClick={() => handleDrawClick('muted_launch_areas')}>השתקה</button>
          <button className="btn btn-danger  panel-button" onClick={() => handleDrawClick('active_launch_areas')}>סינון ירי</button>
        </div>

        {showNamePrompt && (
          <div className="bg-light text-dark p-3 mt-3 rounded shadow">
            <label htmlFor="polygon-name-input" className="form-label">שם לפוליגון:</label>
            <input
              id="polygon-name-input"
              type="text"
              className="form-control mb-2"
              placeholder="הכנס שם לפוליגון"
              autoFocus
            />
            <button className="btn btn-success btn-sm me-2" onClick={confirmPolygonName}>אישור</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowNamePrompt(false)}>ביטול</button>
          </div>
        )}
      </div>
      {openDialogDelit && (
        <div className='bg-light text-dark p-3 mt-3 rounded shadow'>
          ?   למחוק את פוליגון {polygonID}
          <div>
            <button className="btn btn-success btn-sm me-2" onClick={() => { delitPoligonOk(polygonID) }}>אישור</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => { setopenDialogDelit(false) }}>ביטול</button>
          </div>

        </div>
      )}

      <hr className="border-secondary my-3 section-divider-override" />

      <div className="d-flex flex-column flex-grow-1 poligonList">
        <h2 className="fs-5 border-bottom border-secondary pb-2 mb-3 section-title-override">רשימת הפוליגונים</h2>
        <div className="flex-grow-1 overflow-auto pe-2 polygon-list-override">



          {polygons && (
            <>
              <div className="accordion accordion-flush" id="accordionFlushExample">
                <div className="accordion-item  ">
                  <h2 className="accordion-header ">
                    <button className="accordion-button collapsed  " type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseOne" aria-expanded="false" aria-controls="flush-collapseOne">
                      פוליגוני התרעה
                    </button>
                  </h2>
                  <div id="flush-collapseOne" className="accordion-collapse collapse" data-bs-parent="#accordionFlushExample">
                    <div className="accordion-body bg-secondary ">
                      {alertIds.map((alertId, i) => (
                        <div key={i}
                          className="bg-dark p-3 mb-2 rounded border border-secondary polygon-item-override"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setFocusPolygonId(alertId)}
                        >
                          <div>
                            <div className='row'>
                              <div className='col-6' >
                                <button className='trash-button' onClick={() => { delitPoligon(alertId) }}>  <i class="bi bi-trash"></i></button>
                              </div>
                              <div className='col-6'>
                                <div className="fw-bold fs-6 textNameP mb-1">{alertId}</div>
                              </div>
                            </div>

                          </div>

                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="accordion-item">
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseTwo" aria-expanded="false" aria-controls="flush-collapseTwo">
                      פוליגוני השתקה
                    </button>
                  </h2>
                  <div id="flush-collapseTwo" className="accordion-collapse collapse" data-bs-parent="#accordionFlushExample">
                    <div className="accordion-body bg-secondary">
                      {mutedIds.map((mutedId, i) => (
                        <div key={i}
                          className="bg-dark  p-3 mb-2 rounded border border-secondary polygon-item-override"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setFocusPolygonId(mutedId)}
                        >
                          <div>
                            <div className='row'>
                              <div className='col-6' >
                                <button className='trash-button' onClick={() => { delitPoligon(mutedId) }}>  <i class="bi bi-trash"></i></button>
                              </div>
                              <div className='col-6'>
                                <div className="fw-bold fs-6 textNameP mb-1">{mutedId}</div>
                              </div>
                            </div>

                          </div>

                        </div>
                      ))}</div>
                  </div>
                </div>
                <div className="accordion-item">
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseThree" aria-expanded="false" aria-controls="flush-collapseThree">
                      סינון ירי
                    </button>
                  </h2>
                  <div id="flush-collapseThree" className="accordion-collapse collapse" data-bs-parent="#accordionFlushExample">
                    <div className="accordion-body bg-secondary">
                      {activeIds.map((activeId, i) => (
                      <div key={i}
                        className="bg-dark p-3 mb-2 rounded border border-secondary polygon-item-override"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setFocusPolygonId(activeId)}
                      >
                        <div>
                          <div className='row'>
                            <div className='col-6' >
                              <button className='trash-button' onClick={() => { delitPoligon(activeId) }}>  <i class="bi bi-trash"></i></button>
                            </div>
                            <div className='col-6'>
                              <div className="fw-bold fs-6 textNameP mb-1">{activeId}</div>
                            </div>
                          </div>



                        </div>

                      </div>
                    ))}</div>
                  </div>
                </div>
              </div>

            </>
          )}
 <ToastContainer />


        </div>
      </div>
    </div>
  );
}

export default ControlPanel;




