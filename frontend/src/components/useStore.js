


import { create } from 'zustand';

const useStore = create((set) => ({
  drawing: false,
  setDrawing: (value) => set({ drawing: value }),

  polygonStatus: null,
  setPolygonStatus: (status) => set({ polygonStatus: status }),

  polygonName: 'פוליגון חדש',
  setPolygonName: (name) => set({ polygonName: name }),

  polygons: {
    alert_areas: [],
    muted_launch_areas: [],
    active_launch_areas: []
  },
  setPolygons: (data) => set({ polygons: data }),


  removePolygon: (polyID) => set((state) => {
  const updated = {};

  for (const [key, list] of Object.entries(state.polygons)) {
    updated[key] = list.filter(p => p.id !== polyID);
  }

  return { polygons: updated };
}),

  
  vectorSourceRef: null,
  setVectorSourceRef: (ref) => set({ vectorSourceRef: ref }),



  addPolygon: (newPoly) => {
  set((state) => {
    const key = newPoly.status;

    // ודא שהמפתח תקף
    if (!state.polygons.hasOwnProperty(key)) return state;

    return {
      polygons: {
        ...state.polygons,
        [key]: [...state.polygons[key], newPoly]
      }
    };
  });
},
  



  focusPolygonId: null,
  setFocusPolygonId: (id) => set({ focusPolygonId: id }),
}));

export default useStore;




