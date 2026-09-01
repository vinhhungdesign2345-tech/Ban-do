// ==========================================
// js/measure.js - QUẢN LÝ ĐO ĐẠC (ĐO KHOẢNG CÁCH, DIỆN TÍCH VÀ CHU VI)
// ==========================================

let isMeasuring = false;
let measureCoordinates = [];
let measureMarkers = [];
let measurePointMarkers = [];
let measureHistory = [];
let measureRedoStack = [];

function pushMeasureState() {
    measureHistory.push([...measureCoordinates]);
    measureRedoStack = [];
}

function clearMeasureMarkers() {
    measureMarkers.forEach(marker => marker.remove());
    measureMarkers = [];
    measurePointMarkers.forEach(marker => marker.remove());
    measurePointMarkers = [];
}

function updateMeasureGeometry(map, skipRecreateMarkers = false) {
    const features = [];
    
    if (!skipRecreateMarkers) {
        clearMeasureMarkers();

        measureCoordinates.forEach((coord, index) => {
            const marker = new maplibregl.Marker({
                draggable: true,
                color: index === 0 ? '#ff0055' : '#3388ff'
            })
            .setLngLat(coord)
            .addTo(map);

            marker.getElement().addEventListener('click', (e) => {
                e.stopPropagation();
                if (isMeasuring) {
                    pushMeasureState();
                    measureCoordinates.splice(index, 1);
                    updateMeasureGeometry(map, false);
                }
            });

            marker.on('dragstart', () => {
                window._isDraggingMarker = true;
                if (map.dragPan) map.dragPan.disable();
                pushMeasureState();
            });

            marker.on('drag', () => {
                const lngLat = marker.getLngLat();
                measureCoordinates[index] = [lngLat.lng, lngLat.lat];
                updateMeasureGeometry(map, true);
            });

            marker.on('dragend', () => {
                window._isDraggingMarker = false;
                if (map.dragPan) map.dragPan.enable();
                updateMeasureGeometry(map, false);
            });

            measurePointMarkers.push(marker);
        });
    } else {
        measureMarkers.forEach(marker => marker.remove());
        measureMarkers = [];
    }

    measureCoordinates.forEach(coord => {
        features.push({
            type: 'Feature',
            geometry: { 
                type: 'Point', 
                coordinates: coord 
            },
            properties: {}
        });
    });

    if (measureCoordinates.length >= 2) {
        let renderCoords = [...measureCoordinates];
        let isClosed = false;

        if (measureCoordinates.length >= 3) {
            const first = measureCoordinates[0];
            const last = measureCoordinates[measureCoordinates.length - 1];
            if (first[0] === last[0] && first[1] === last[1]) {
                isClosed = true;
            }
        }

        features.push({
            type: 'Feature',
            geometry: { 
                type: 'LineString', 
                coordinates: renderCoords 
            },
            properties: {}
        });

        if (measureCoordinates.length >= 3) {
            const closedPolygonCoords = [...measureCoordinates];
            const first = closedPolygonCoords[0];
            const last = closedPolygonCoords[closedPolygonCoords.length - 1];
            if (first[0] !== last[0] || first[1] !== last[1]) {
                closedPolygonCoords.push(first);
            }
            features.push({
                type: 'Feature',
                geometry: { 
                    type: 'Polygon', 
                    coordinates: [closedPolygonCoords] 
                },
                properties: {}
            });
        }

        if (typeof turf !== 'undefined') {
            let segmentsToRender = [];
            let totalPerimeter = 0;
            
            for (let i = 0; i < renderCoords.length - 1; i++) {
                const seg = {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [renderCoords[i], renderCoords[i+1]]
                    },
                    properties: {}
                };
                segmentsToRender.push(seg);
                totalPerimeter += turf.length(seg, { units: 'meters' });
            }

            if (renderCoords.length >= 3) {
                const first = renderCoords[0];
                const last = renderCoords[renderCoords.length - 1];
                if (first[0] !== last[0] || first[1] !== last[1]) {
                    const closingSeg = {
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: [last, first]
                        },
                        properties: {}
                    };
                    segmentsToRender.push(closingSeg);
                    totalPerimeter += turf.length(closingSeg, { units: 'meters' });
                }
            }

            segmentsToRender.forEach(segment => {
                const segLength = turf.length(segment, { units: 'meters' });
                const segText = segLength >= 1000 
                    ? `${(segLength / 1000).toFixed(2)} km` 
                    : `${segLength.toFixed(1)} m`;

                const coords = segment.geometry.coordinates;
                const midCoord = [(coords[0][0] + coords[1][0]) / 2, (coords[0][1] + coords[1][1]) / 2];

                const el = document.createElement('div');
                el.style.color = '#ff0055';
                el.style.fontSize = '12px';
                el.style.fontWeight = 'Bold';
                el.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                el.style.padding = '2px 5px';
                el.style.borderRadius = '3px';
                el.style.border = '1px solid #ff0055';
                el.style.whiteSpace = 'nowrap';
                el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
                el.innerText = segText;

                const marker = new maplibregl.Marker({ 
                    element: el, 
                    anchor: 'center' 
                })
                .setLngLat(midCoord)
                .addTo(map);

                measureMarkers.push(marker);
            });

            if (measureCoordinates.length >= 3) {
                try {
                    const closedCoords = [...measureCoordinates];
                    const first = closedCoords[0];
                    const last = closedCoords[closedCoords.length - 1];
                    if (first[0] !== last[0] || first[1] !== last[1]) {
                        closedCoords.push(first);
                    }
                    const polygon = turf.polygon([closedCoords]);
                    const areaSqm = turf.area(polygon);
                    const centroid = turf.centroid(polygon);
                    const centerCoord = centroid.geometry.coordinates;

                    const areaText = areaSqm >= 10000 
                        ? `${(areaSqm / 10000).toFixed(2)} ha` 
                        : `${areaSqm.toFixed(1)} m²`;

                    const areaEl = document.createElement('div');
                    areaEl.style.color = '#ffffff';
                    areaEl.style.fontSize = '13px';
                    areaEl.style.fontWeight = 'Bold';
                    areaEl.style.backgroundColor = 'rgba(217, 48, 37, 0.9)';
                    areaEl.style.padding = '3px 8px';
                    areaEl.style.borderRadius = '4px';
                    areaEl.style.border = '1px solid #ffffff';
                    areaEl.style.whiteSpace = 'nowrap';
                    areaEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.4)';
                    areaEl.innerText = areaText;

                    const areaMarker = new maplibregl.Marker({ 
                        element: areaEl, 
                        anchor: 'center' 
                    })
                    .setLngLat(centerCoord)
                    .addTo(map);

                    measureMarkers.push(areaMarker);

                    const lastPointCoord = measureCoordinates[measureCoordinates.length - 1];
                    const perimeterText = totalPerimeter >= 1000 
                        ? `Chu vi: ${(totalPerimeter / 1000).toFixed(2)} km` 
                        : `Chu vi: ${totalPerimeter.toFixed(1)} m`;

                    const perimEl = document.createElement('div');
                    perimEl.style.color = '#d93025';
                    perimEl.style.fontSize = '12px';
                    perimEl.style.fontWeight = 'Bold';
                    perimEl.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                    perimEl.style.padding = '2px 6px';
                    perimEl.style.borderRadius = '4px';
                    perimEl.style.border = '1px solid #d93025';
                    perimEl.style.whiteSpace = 'nowrap';
                    perimEl.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
                    perimEl.innerText = perimeterText;

                    const perimMarker = new maplibregl.Marker({ 
                        element: perimEl, 
                        anchor: 'bottom-left', 
                        offset: [15, -15] 
                    })
                    .setLngLat(lastPointCoord)
                    .addTo(map);

                    measureMarkers.push(perimMarker);

                } catch (err) {
                    console.error("Lỗi tính và hiển thị diện tích/chu vi đo đạc:", err);
                }
            }
        }
    }

    if (map.getSource('measure-source')) {
        map.getSource('measure-source').setData({
            type: 'FeatureCollection',
            features: features
        });
    }
}

function resetMeasure(map) {
    isMeasuring = false;
    measureCoordinates = [];
    measureHistory = [];
    measureRedoStack = [];
    clearMeasureMarkers();
    
    const measureBtn = document.getElementById('measureDistBtn');
    if (measureBtn) {
        measureBtn.style.backgroundColor = '#ffffff';
        measureBtn.style.color = '#333';
        measureBtn.innerText = '📏 Đo khoảng cách';
    }

    if (map) {
        map.getCanvas().style.cursor = 'default';
        if (map.getSource('measure-source')) {
            map.getSource('measure-source').setData({ 
                type: 'FeatureCollection', 
                features: [] 
            });
        }
    }
}

function initMeasureFeature(map) {
    if (!map.getSource('measure-source')) {
        map.addSource('measure-source', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
        });

        map.addLayer({
            id: 'measure-polygon-fill',
            type: 'fill',
            source: 'measure-source',
            filter: ['==', '$type', 'Polygon'],
            paint: {
                'fill-color': '#ff0055',
                'fill-opacity': 0.2
            }
        });

        map.addLayer({
            id: 'measure-lines',
            type: 'line',
            source: 'measure-source',
            filter: ['in', '$type', 'LineString', 'Polygon'],
            paint: {
                'line-color': '#ff0055',
                'line-width': 3,
                'line-dasharray': [2, 2]
            }
        });
    }

    const measureBtn = document.getElementById('measureDistBtn');
    if (measureBtn) {
        measureBtn.onclick = function() {
            isMeasuring = !isMeasuring;
            if (isMeasuring) {
                this.style.backgroundColor = '#e0e0e0';
                this.style.color = '#d93025';
                this.innerText = '🛑 Hủy đo';
                map.getCanvas().style.cursor = 'crosshair';
                if (typeof closeParcelPanel === 'function') closeParcelPanel();
            } else {
                resetMeasure(map);
            }
        };
    }

    window.addEventListener('keydown', (e) => {
        if (!isMeasuring) return;

        const isCtrlOrMeta = e.ctrlKey || e.metaKey;
        const keyLower = e.key.toLowerCase();

        if (isCtrlOrMeta && ((e.shiftKey && keyLower === 'z') || keyLower === 'y')) {
            e.preventDefault();
            if (measureRedoStack.length > 0) {
                measureHistory.push([...measureCoordinates]);
                measureCoordinates = measureRedoStack.pop();
                updateMeasureGeometry(map, false);
            }
        } 
        else if (isCtrlOrMeta && keyLower === 'z') {
            e.preventDefault();
            if (measureHistory.length > 0) {
                measureRedoStack.push([...measureCoordinates]);
                measureCoordinates = measureHistory.pop();
                updateMeasureGeometry(map, false);
            }
        }
    });
}
