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
                columnNLinkHTML = `<a href="javascript:void(0);" onclick="window._viewColN_${parcelId}();" style="color: #007bff; text-decoration: underline; font-weight: bold;">Xem</a>`;
            } else {
                window[`_inputColN_${parcelId}`] = () => openColumnNPopup(parcelId, 'input', '');
                columnNLinkHTML = `<a href="javascript:void(0);" onclick="window._inputColN_${parcelId}();" style="color: #d93025; text-decoration: underline; font-weight: bold;">Nhập</a>`;
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
                <div><b>Ghi chú:</b> ${columnNLinkHTML}</div>
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
