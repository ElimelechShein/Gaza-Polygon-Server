

import react, { useState } from 'react'
import MapGaza from '../components/MapGaza'

import '../style/style.css'
import ControlPanel from '../components/ControlPanel';

function Home() {
 const [openControl, setOpenControl] = useState(false);

  const handleToggleControl = () => setOpenControl(prev => !prev);

  
  return (
    <>
      <div className='container-fluid ' >
        <div className='haeder row '>
          <div className='col-2'>
   
          </div>
          <div className='col-8'>
            <h4 className='text-center '> מערכת שליטה בהתראות המכ"מים   </h4>
          <p className='text-center phaeder'>במערכת זו ניתן ליצור / לערוך / למחוק  - פוליגוני התרעה / השתקה  , ניתן גם להשבית התראות מירי כוחותינו </p>
    </div>
          <div className='col-2'> 
           <button className="burger-button" onClick={handleToggleControl}>
        <i className="bi bi-list"></i>
      </button>


          </div>

              </div>
        <div className="container">

          <div className='main'>
                <div className={`control-panel-sidebar ${openControl ? 'open' : ''}`}>
        <ControlPanel />
      </div>
    <div className="full-screen-container divMap">
  
      <MapGaza />
    </div>
          </div>
          <div className='footer'>
 
          </div>
        </div>

      </div>

    </>
  )
}

export default Home


