// ==========================================
// js/map.js - QUẢN LÝ BẢN ĐỒ MAPLIBRE VÀ TƯƠNG TÁC
// ==========================================

// --- KHAI BÁO BIẾN TOÀN CỤC QUẢN LÝ NHÃN SỐ ĐO CẠNH VÀ ID THỬA ĐẤT ---
let activeMarkers = [];                  // Mảng lưu trữ các đối tượng Marker hiển thị kích thước cạnh trên bản đồ
window.selectedThuaDatId = null;         // Biến toàn cục lưu ID thửa đất đang được chọn

// --- BIẾN TOÀN CỤC CHO TÍNH NĂNG ĐO KHOẢNG CÁCH / DIỆN TÍCH ---
let isMeasuring = false;                 
let measureCoordinates = [];             
let measureMarkers = [];                 // Lưu trữ các marker nhãn số đo cạnh và diện tích khi đo
let measurePointMarkers = [];            // Lưu trữ các marker điểm mốc kéo thả khi đo

// --- QUẢN LÝ LỊCH SỬ UNDO / REDO THÔNG MINH (LƯU TRẠNG THÁI MẢNG TỌA ĐỘ) ---
let measureHistory = [];                 // Mảng lưu lịch sử các trạng thái tọa độ để Undo
let measureRedoStack = [];               // Mảng lưu lịch sử để Redo

function pushMeasureState() {
    measureHistory.push([...measureCoordinates]);
    measureRedoStack = [];               // Xóa stack redo mỗi khi có hành động thêm/sửa/xóa mới
}

// ==========================================
// HÀM XÓA SẠCH CÁC NHÃN SỐ ĐO CẠNH TRÊN BẢN ĐỒ
// ==========================================
function clearLengthMarkers() {
    activeMarkers.forEach(marker => marker.remove());
    activeMarkers = [];
}

// ==========================================
// HÀM XÓA SẠCH CÁC NHÃN ĐO ĐẠC
// ==========================================
function clearMeasureMarkers() {
    measureMarkers.forEach(marker => marker.remove());
    measureMarkers = [];
    measurePointMarkers.forEach(marker => marker.remove());
    measurePointMarkers = [];
}

// ==========================================
// HÀM ĐỊNH DẠNG SỐ CHUẨN VIỆT NAM (HỖ TRỢ GIỮ NGUYÊN SỐ THỰC)
// ==========================================
function formatNumberVN(val) {
    if (val === null || val === undefined || val === '' || val === '-') return '-';
    
    const stringVal = String(val).replace(',', '.');
    const num = parseFloat(stringVal);
    
    if (isNaN(num)) return val;

    return num.toLocaleString('vi-VN', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 2 
    });
}

// ==========================================
// HÀM ĐÓNG BẢNG THÔNG TIN VÀ XÓA TRẠNG THÁI LÀM NỔI BẬT THỬA ĐẤT
// ==========================================
function closeParcelPanel() {
    const panel = document.getElementById('parcel-info-panel');
    
    if (panel) panel.style.display = 'none';

    window.selectedThuaDatId = null;

    clearLengthMarkers();

    const mapInstance = window.currentMapInstance;
    if (mapInstance) {
        if (mapInstance.getLayer('sheet-thua-dat-highlight-fill')) {
            mapInstance.setFilter('sheet-thua-dat-highlight-fill', ['==', ['get', 'ID Thửa Đất'], '']);
        }
        
        if (mapInstance.getLayer('sheet-thua-dat-highlight-line')) {
            mapInstance.setFilter('sheet-thua-dat-highlight-line', ['==', ['get', 'ID Thửa Đất'], '']);
        }

        if (mapInstance.getSource('parcel-dimensions-source')) {
            mapInstance.getSource('parcel-dimensions-source').setData({
                type: 'FeatureCollection',
                features: [] 
            });
        }
    }
}

// ==========================================
// HÀM MỞ POPUP XEM HOẶC NHẬP DỮ LIỆU CỘT N
// ==========================================
function openColumnNPopup(parcelId, mode, currentData = '') {
    // Kiểm tra hoặc tạo phần tử Popup trên DOM nếu chưa có
    let popupContainer = document.getElementById('column-n-popup-modal');
    
    if (!popupContainer) {
        popupContainer = document.createElement('div');
        popupContainer.id = 'column-n-popup-modal';
        popupContainer.style.cssText = `
            position: fixed; 
            top: 0; 
            left: 0; 
            width: 100%; 
            height: 100%;
            background: rgba(0, 0, 0, 0.5); 
            display: flex; 
            align-items: center;
            justify-content: center; 
            z-index: 9999;
        `;
        document.body.appendChild(popupContainer);
    }

    const isViewMode = mode === 'view';
    
    popupContainer.innerHTML = `
        <div style="background: #fff; padding: 20px; border-radius: 8px; width: 400px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
            <h3 style="margin-top: 0; color: #333;">${isViewMode ? '📖 Xem dữ liệu cột N' : '✍️ Nhập dữ liệu cột N'}</h3>
            <p style="font-size: 13px; color: #666;">ID Thửa đất: <b>${parcelId}</b></p>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Nội dung:</label>
                <textarea id="popup-n-content" ${isViewMode ? 'readonly' : ''} style="width: 100%; height: 100px; padding: 8px; border: 1px solid #ccc; border-radius: 4px; resize: vertical;">${currentData}</textarea>
            </div>
            
            <div style="text-align: right;">
                <button id="popup-close-btn" style="padding: 6px 12px; margin-right: 5px; background: #ccc; border: none; border-radius: 4px; cursor: pointer;">Đóng</button>
                ${!isViewMode ? `<button id="popup-save-btn" style="padding: 6px 12px; background: #28a745; color: #fff; border: none; border-radius: 4px; cursor: pointer;">Lưu lại</button>` : ''}
            </div>
        </div>
    `;

    popupContainer.style.display = 'flex';

    // Xử lý sự kiện đóng popup
    document.getElementById('popup-close-btn').onclick = () => {
        popupContainer.style.display = 'none';
    };

    // Xử lý sự kiện lưu (ở chế độ nhập) kết hợp gọi API Google Apps Script
    if (!isViewMode) {
        document.getElementById('popup-save-btn').onclick = () => {
            const val = document.getElementById('popup-n-content').value;
            
            // 1. Cập nhật ngay vào bộ nhớ tạm để UI phản hồi
            if (window._currentParcelRawProps) {
                window._currentParcelRawProps['Cột N'] = val;
            }

            const saveBtn = document.getElementById('popup-save-btn');
            saveBtn.innerText = 'Đang lưu...';
            saveBtn.disabled = true;

            // 2. Gửi request POST đến Web App URL của Google Apps Script (Sử dụng mode 'no-cors' để tối ưu ghi ngầm, tránh chặn CORS từ trình duyệt)
            const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz87dcUkndM5w5BeFqUFYJt8JDEcPu98IH5mbzNdov_6eXTNUEhIiknFQ9P7H2c0ZQE/exec';

            fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    action: 'update_column_n',
                    id_thua_dat: parcelId,
                    ghi_chu: val
                })
            });

            // 3. Đóng popup và thông báo thành công ngay lập tức
            popupContainer.style.display = 'none';

            if (window.selectedThuaDatId === parcelId && window._currentParcelRawProps) {
                renderParcelPanel(window._currentParcelRawProps, parcelId);
            }

            alert('Đã cập nhật dữ liệu cột N thành công vào Google Sheet!');
        };
    }
}

// ==========================================
// HÀM CẬP NHẬT HÌNH HỌC VÀ NHÃN ĐO ĐẠC
// ==========================================
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

// ==========================================
// HÀM HỦY / ĐẶT LẠI TRẠNG THÁI ĐO ĐẠC
// ==========================================
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

// ==========================================
// HÀM KHỞI TẠO VÀ CẤU HÌNH TOÀN BỘ BẢN ĐỒ
// ==========================================
function initMap() {
    const map = new maplibregl.Map({
        container: 'map',                        
        style: CONFIG.MAP_STYLE,                 
        center: CONFIG.MAP_CENTER,               
        zoom: CONFIG.MAP_ZOOM                    
    });

    window.currentMapInstance = map;

    const geolocate = new maplibregl.GeolocateControl({
        positionOptions: { 
            enableHighAccuracy: true,          
            maximumAge: 0,                     
            timeout: 20000                     
        },
        trackUserLocation: true,               
        showUserHeading: true                  
    });
    
    map.addControl(geolocate, 'top-right');

    geolocate.on('geolocate', async (position) => {
        const lng = position.coords.longitude; 
        const lat = position.coords.latitude;  
        
        if (typeof selectPhuongFromPoint === 'function') {
            await selectPhuongFromPoint(lng, lat, map);
        }
    });

    map.on('load', () => {
        const satLayer = 'google-satellite-layer'; 
        const osmLayer = 'osm-layer';                

        map.setLayoutProperty(satLayer, 'visibility', 'visible');
        map.setLayoutProperty(osmLayer, 'visibility', 'none');

        const toggleBtn = document.getElementById('toggleLayerBtn');
        if (toggleBtn) {
            toggleBtn.innerText = 'Chuyển sang Bản đồ OSM';

            toggleBtn.onclick = function() {
                const isSatVisible = map.getLayoutProperty(satLayer, 'visibility') === 'visible';
                
                if (isSatVisible) {
                    map.setLayoutProperty(satLayer, 'visibility', 'none');
                    map.setLayoutProperty(osmLayer, 'visibility', 'visible');
                    this.innerText = 'Chuyển sang Bản đồ Vệ tinh';
                } else {
                    map.setLayoutProperty(satLayer, 'visibility', 'visible');
                    map.setLayoutProperty(osmLayer, 'visibility', 'none');
                    this.innerText = 'Chuyển sang Bản đồ OSM';
                }
            };
        }

        const opacitySlider = document.getElementById('opacitySlider');
        const opacityValueLabel = document.getElementById('opacityValue');

        if (opacitySlider) {
            opacitySlider.oninput = function() {
                const val = parseFloat(this.value);
                if (opacityValueLabel) opacityValueLabel.innerText = val;

                if (map.getLayer('sheet-thua-dat-fill')) {
                    map.setPaintProperty('sheet-thua-dat-fill', 'fill-opacity', val);
                }
                
                if (map.getLayer('sheet-thua-dat-highlight-fill')) {
                    map.setPaintProperty('sheet-thua-dat-highlight-fill', 'fill-opacity', Math.min(val + 0.2, 1.0));
                }
            };
        }

        if (!map.getSource('parcel-dimensions-source')) {
            map.addSource('parcel-dimensions-source', {
                type: 'geojson',
                data: { 
                    type: 'FeatureCollection', 
                    features: [] 
                }
            });

            map.addLayer({
                id: 'parcel-dimensions-layer',
                type: 'circle',
                source: 'parcel-dimensions-source',
                paint: {
                    'circle-radius': 4,              
                    'circle-color': '#ffffff',     
                    'circle-stroke-width': 1.5,      
                    'circle-stroke-color': '#000000'
                }
            });
        }

        if (!map.getSource('measure-source')) {
            map.addSource('measure-source', {
                type: 'geojson',
                data: { 
                    type: 'FeatureCollection', 
                    features: [] 
                }
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
                    closeParcelPanel();
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

        initFilter(map);
        initThuaDatSearch(map);
    });

    const sheetLayers = ['sheet-thua-dat-fill', 'sheet-thua-dat-line'];
    let isFeatureClicked = false; 

    sheetLayers.forEach(layerId => {
        map.on('click', layerId, (e) => {
            if (isMeasuring) return; 

            if (!e.features || !e.features.length) return;
            isFeatureClicked = true; 

            const selectedFeature = e.features[0];        
            const rawProps = selectedFeature.properties || {}; 

            // Lưu trực tiếp vào biến toàn cục để phục vụ cập nhật UI
            window._currentParcelRawProps = rawProps;

            const parcelId = rawProps['ID Thửa Đất'] || rawProps['id'] || '';
            window.selectedThuaDatId = parcelId;

            clearLengthMarkers();

            if (typeof turf !== 'undefined' && selectedFeature.geometry) {
                try {
                    const lineSegments = turf.lineSegment(selectedFeature);
                    const dimensionFeatures = [];

                    lineSegments.features.forEach(segment => {
                        const lengthMeters = turf.length(segment, { units: 'meters' });
                        
                        const formattedLength = lengthMeters >= 10 
                            ? `${lengthMeters.toFixed(1)}m` 
                            : `${lengthMeters.toFixed(2)}m`;

                        segment.properties.length = formattedLength;
                        dimensionFeatures.push(segment);

                        const coords = segment.geometry.coordinates;
                        const midCoord = [(coords[0][0] + coords[1][0]) / 2, (coords[0][1] + coords[1][1]) / 2];

                        const el = document.createElement('div');
                        el.style.color = '#ffffff';                             
                        el.style.fontSize = '12px';                             
                        el.style.fontWeight = 'Bold';                          
                        el.style.textShadow = '1px 1px 2px #000000, -1px -1px 2px #000000, 1px -1px 2px #000000, -1px 1px 2px #000000'; 
                        el.style.whiteSpace = 'nowrap';                          
                        el.innerText = formattedLength;                          

                        const marker = new maplibregl.Marker({
                            element: el,
                            anchor: 'center'
                        })
                        .setLngLat(midCoord)          
                        .addTo(map);                    

                        activeMarkers.push(marker); 
                    });

                    if (map.getSource('parcel-dimensions-source')) {
                        map.getSource('parcel-dimensions-source').setData({
                            type: 'FeatureCollection',
                            features: dimensionFeatures
                        });
                    }
                } catch (err) {
                    console.error("Lỗi trong quá trình tính toán độ dài cạnh thửa đất:", err);
                }
            }

            const soTo = rawProps['Số tờ'] || rawProps['So to'] || '-';
            const soThua = rawProps['Số thửa'] || rawProps['So thua'] || '-';
            
            const rawDienTich = rawProps['Diện tích'] || 
                                rawProps['Dien tich'] || 
                                rawProps['dien_tich'] || 
                                rawProps['DienTich'] || 
                                rawProps['DIỆN TÍCH'] || 
                                rawProps['Diện tích\nm²'] || 
                                rawProps['Diện\ntích'] || '-';
                                
            const dienTich = formatNumberVN(rawDienTich); 
            
            const loaiDat = rawProps['Loại Đất'] || rawProps['Loại Đất:'] || rawProps['Loại đất'] || rawProps['loai_dat'] || '-';
            const tenChu = rawProps['Tên Chủ'] || rawProps['Tên chủ'] || '-';
            const soDinhDanh = rawProps['Số định danh chủ đất'] || rawProps['Số định danh'] || 'Không có';
            
            // --- XỬ LÝ DỮ LIỆU CỘT N ---
            const columnNValue = rawProps['Cột N'] || rawProps['cot_n'] || rawProps['Ghi Chú'] || rawProps['Ghi chú'] || '';
            let columnNLinkHTML = '';

            if (columnNValue && columnNValue.trim() !== '' && columnNValue !== 'Không có') {
                window[`_viewColN_${parcelId}`] = () => openColumnNPopup(parcelId, 'view', columnNValue);
                columnNLinkHTML = `<a href="javascript:void(0);" onclick="window._viewColN_${parcelId}();" style="color: #007bff; text-decoration: underline; font-weight: bold;">xem</a>`;
            } else {
                window[`_inputColN_${parcelId}`] = () => openColumnNPopup(parcelId, 'input', '');
                columnNLinkHTML = `<a href="javascript:void(0);" onclick="window._inputColN_${parcelId}();" style="color: #d93025; text-decoration: underline; font-weight: bold;">nhập</a>`;
            }

            let selectFilter = parcelId ? ['==', ['get', 'ID Thửa Đất'], rawProps['ID Thửa Đất'] || parcelId] : ['==', ['get', 'Tên Chủ'], tenChu];

            if (map.getLayer('sheet-thua-dat-highlight-fill')) map.setFilter('sheet-thua-dat-highlight-fill', selectFilter);
            if (map.getLayer('sheet-thua-dat-highlight-line')) map.setFilter('sheet-thua-dat-highlight-line', selectFilter);

            const panelContent = `
                <div><b>Số tờ:</b> ${soTo}</div>
                <div><b>Số thửa:</b> ${soThua}</div>
                <div><b>Diện tích:</b> ${dienTich} m²</div>
                <div><b>Loại đất:</b> ${loaiDat}</div>
                <div style="grid-column: span 2;"><b>Tên chủ:</b> ${tenChu}</div>
                <div><b>Số định danh:</b> ${soDinhDanh}</div>
                <div><b>Cột N:</b> ${columnNLinkHTML}</div>
            `;

            const panelContentEl = document.getElementById('panel-content');
            const panelEl = document.getElementById('parcel-info-panel');
            if (panelContentEl) panelContentEl.innerHTML = panelContent;
            if (panelEl) panelEl.style.display = 'block'; 
        });

        map.on('mouseenter', layerId, () => map.getCanvas().style.cursor = 'default');
        map.on('mouseleave', layerId, () => map.getCanvas().style.cursor = 'default');
    });

    map.on('click', (e) => {
        if (isMeasuring) {
            if (window._isDraggingMarker) return;

            const coords = [e.lngLat.lng, e.lngLat.lat];
            
            if (measureCoordinates.length >= 2 && typeof turf !== 'undefined') {
                const firstCoord = measureCoordinates[0];
                const distanceToFirst = turf.distance(
                    turf.point(firstCoord),
                    turf.point(coords),
                    { units: 'meters' }
                );
                
                if (distanceToFirst < 5) {
                    pushMeasureState();
                    measureCoordinates.push([...firstCoord]);
                    updateMeasureGeometry(map, false);
                    return;
                }
            }

            pushMeasureState();
            measureCoordinates.push(coords);
            updateMeasureGeometry(map, false);
            return;
        }

        if (!isFeatureClicked) {
            closeParcelPanel();     
            
            if (typeof selectPhuongFromPoint === 'function') {
                selectPhuongFromPoint(e.lngLat.lng, e.lngLat.lat, map);
            }
        }
        isFeatureClicked = false; 
    });
}

document.addEventListener('DOMContentLoaded', initMap);
