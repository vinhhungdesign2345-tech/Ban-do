// js/map.js

// --- KHAI BÁO BIẾN TOÀN CỤC QUẢN LÝ NHÃN SỐ ĐO CẠNH, THỬA ĐẤT VÀ TÍNH NĂNG ĐO ---
let activeMarkers = [];          // Mảng lưu trữ các đối tượng Marker hiển thị kích thước cạnh thửa đất
let measureMarkers = [];         // Mảng lưu trữ các đối tượng Marker hiển thị số đo từng đoạn khi người dùng tự đo
window.selectedThuaDatId = null; // Biến toàn cục lưu ID thửa đất đang được chọn

let isMeasuring = false;         // Trạng thái bật/tắt tính năng đo khoảng cách
let measureCoordinates = [];     // Mảng lưu trữ các điểm mốc người dùng click lên bản đồ để đo đạc

// --- HÀM XÓA SẠCH CÁC NHÃN SỐ ĐO CẠNH THỬA ĐẤT ---
function clearLengthMarkers() {
    activeMarkers.forEach(marker => marker.remove());
    activeMarkers = [];
}

// --- HÀM XÓA SẠCH CÁC NHÃN ĐO KHOẢNG CÁCH TỰ DO ---
function clearMeasureMarkers() {
    measureMarkers.forEach(marker => marker.remove());
    measureMarkers = [];
}

// --- HÀM ĐỊNH DẠNG SỐ CHUẨN VIỆT NAM (HỖ TRỢ GIỮ NGUYÊN SỐ THỰC) ---
function formatNumberVN(val) {
    if (val === null || val === undefined || val === '' || val === '-') return '-';
    const stringVal = String(val).replace(',', '.');
    const num = parseFloat(stringVal);
    if (isNaN(num)) return val;
    return num.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// --- HÀM ĐÓNG BẢNG THÔNG TIN VÀ XÓA TRẠNG THÁI LÀM NỔI BẬT (HIGHLIGHT) THỬA ĐẤT ---
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

// --- HÀM CẬP NHẬT ĐƯỜNG ĐO, HIỂN THỊ SỐ ĐO TỪNG ĐOẠN VÀ TÍNH TỔNG KHOẢNG CÁCH/DIỆN TÍCH ---
function updateMeasureGeometry(map) {
    const features = [];
    
    // Xóa các nhãn số đo đoạn cũ trên bản đồ trước khi vẽ lại nhãn mới
    clearMeasureMarkers();

    // Tạo các điểm mốc (điểm chấm tròn) tại vị trí người dùng click
    measureCoordinates.forEach(coord => {
        features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: coord },
            properties: {}
        });
    });

    // Nếu có từ 2 điểm trở lên, tạo đoạn thẳng và tính toán kích thước từng đoạn
    if (measureCoordinates.length >= 2) {
        const lineFeature = {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: measureCoordinates },
            properties: {}
        };
        features.push(lineFeature);

        // 📏 Dùng Turf.js tách đường đo thành từng đoạn nhỏ (line segments) để ghim số đo từng cạnh
        const lineSegments = turf.lineSegment(lineFeature);
        lineSegments.features.forEach(segment => {
            const segLength = turf.length(segment, { units: 'meters' });
            const segText = segLength >= 1000 ? `${(segLength / 1000).toFixed(2)} km` : `${segLength.toFixed(1)} m`;

            // Lấy tọa độ điểm giữa của đoạn thẳng để đặt nhãn
            const coords = segment.geometry.coordinates;
            const midCoord = [(coords[0][0] + coords[1][0]) / 2, (coords[0][1] + coords[1][1]) / 2];

            // Tạo phần tử hiển thị số đo từng đoạn
            const el = document.createElement('div');
            el.style.color = '#ff0055';
            el.style.fontSize = '12px';
            el.style.fontWeight = 'Bold';
            el.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            el.style.padding = '1px 4px';
            el.style.borderRadius = '3px';
            el.style.border = '1px solid #ff0055';
            el.style.whiteSpace = 'nowrap';
            el.innerText = segText;

            const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
                .setLngLat(midCoord)
                .addTo(map);

            measureMarkers.push(marker);
        });

        // 📐 Tính tổng chiều dài toàn tuyến
        const totalLength = turf.length(lineFeature, { units: 'meters' });
        const totalLengthText = totalLength >= 1000 ? `${(totalLength / 1000).toFixed(2)} km` : `${totalLength.toFixed(1)} m`;

        // 🟩 Nếu khép kín đa giác (điểm đầu trùng điểm cuối hoặc có từ 3 điểm trở lên khép kín), tính thêm diện tích
        let areaText = '';
        if (measureCoordinates.length >= 3) {
            try {
                // Tạo một bản sao tọa độ khép kín để Turf.js tính diện tích polygon
                const closedCoords = [...measureCoordinates];
                const first = closedCoords[0];
                const last = closedCoords[closedCoords.length - 1];
                if (first[0] !== last[0] || first[1] !== last[1]) {
                    closedCoords.push(first);
                }
                const polygon = turf.polygon([closedCoords]);
                const areaSqm = turf.area(polygon);
                
                if (areaSqm >= 10000) {
                    areaText = ` | Diện tích: ${(areaSqm / 10000).toFixed(2)} ha`;
                } else {
                    areaText = ` | Diện tích: ${areaSqm.toFixed(1)} m²`;
                }
            } catch (err) {
                console.error("Lỗi tính diện tích đo đạc:", err);
            }
        }

        // Đưa kết quả tổng khoảng cách và diện tích ra khung popup dưới màn hình
        const resultBox = document.getElementById('measure-result-box');
        const resultEl = document.getElementById('measure-result');
        if (resultBox) resultBox.style.display = 'block';
        if (resultEl) resultEl.innerText = `${totalLengthText}${areaText}`;
    }

    if (map.getSource('measure-source')) {
        map.getSource('measure-source').setData({
            type: 'FeatureCollection',
            features: features
        });
    }
}

// --- HÀM HỦY VÀ LÀM SẠCH TRẠNG THÁI ĐO KHOẢNG CÁCH ---
function resetMeasure(map) {
    isMeasuring = false;
    measureCoordinates = [];
    clearMeasureMarkers();
    
    const measureBtn = document.getElementById('measureDistBtn');
    if (measureBtn) {
        measureBtn.style.backgroundColor = '#ffffff';
        measureBtn.style.color = '#333';
        measureBtn.innerText = '📏 Đo khoảng cách';
    }
    
    const resultBox = document.getElementById('measure-result-box');
    if (resultBox) resultBox.style.display = 'none';

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

// --- HÀM KHỞI TẠO VÀ CẤU HÌNH TOÀN BỘ BẢN ĐỒ ---
function initMap() {
    const map = new maplibregl.Map({
        container: 'map',
        style: CONFIG.MAP_STYLE,
        center: CONFIG.MAP_CENTER,
        zoom: CONFIG.MAP_ZOOM
    });

    window.currentMapInstance = map;

    const geolocate = new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
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
                data: { type: 'FeatureCollection', features: [] }
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
                data: { type: 'FeatureCollection', features: [] }
            });

            map.addLayer({
                id: 'measure-lines',
                type: 'line',
                source: 'measure-source',
                filter: ['==', '$type', 'LineString'],
                paint: {
                    'line-color': '#ff0055',
                    'line-width': 3,
                    'line-dasharray': [2, 2]
                }
            });

            map.addLayer({
                id: 'measure-points',
                type: 'circle',
                source: 'measure-source',
                filter: ['==', '$type', 'Point'],
                paint: {
                    'circle-radius': 5,
                    'circle-color': '#ffffff',
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ff0055'
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
                    closeParcelPanel(); // Đóng bảng thửa đất nếu đang mở
                } else {
                    resetMeasure(map);
                }
            };
        }

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

            const parcelId = rawProps['ID Thửa Đất'] || rawProps['id'] || '';
            window.selectedThuaDatId = parcelId;

            clearLengthMarkers();

            if (typeof turf !== 'undefined' && selectedFeature.geometry) {
                try {
                    const lineSegments = turf.lineSegment(selectedFeature);
                    const dimensionFeatures = [];

                    lineSegments.features.forEach(segment => {
                        const lengthMeters = turf.length(segment, { units: 'meters' });
                        const formattedLength = lengthMeters >= 10 ? `${lengthMeters.toFixed(1)}m` : `${lengthMeters.toFixed(2)}m`;

                        segment.properties.length = formattedLength;
                        dimensionFeatures.push(segment);

                        const coords = segment.geometry.coordinates;
                        const midCoord = [(coords[0][0] + coords[1][0]) / 2, (coords[0][1] + coords[1][1]) / 2];

                        const el = document.createElement('div');
                        el.style.color = '#ffffff';
                        el.style.fontSize = '12px';
                        el.style.fontWeight = 'Bold';
                        el.style.textShadow = '1px 1px 2px #000000, -1px -1px 2px #000000';
                        el.style.whiteSpace = 'nowrap';
                        el.innerText = formattedLength;

                        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
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
                    console.error("Lỗi tính toán độ dài cạnh thửa đất:", err);
                }
            }

            const soTo = rawProps['Số tờ'] || rawProps['So to'] || '-';
            const soThua = rawProps['Số thửa'] || rawProps['So thua'] || '-';
            const rawDienTich = rawProps['Diện tích'] || rawProps['Dien tich'] || rawProps['dien_tich'] || rawProps['DienTich'] || '-';
            const dienTich = formatNumberVN(rawDienTich);
            const loaiDat = rawProps['Loại Đất'] || rawProps['Loại đất'] || '-';
            const tenChu = rawProps['Tên Chủ'] || rawProps['Tên chủ'] || '-';
            const soDinhDanh = rawProps['Số định danh chủ đất'] || rawProps['Số định danh'] || 'Không có';
            const ghiChu = rawProps['Ghi Chú'] || rawProps['Ghi chú'] || 'Không có';

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
                <div><b>Ghi chú:</b> ${ghiChu}</div>
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
            const coords = [e.lngLat.lng, e.lngLat.lat];
            measureCoordinates.push(coords);
            updateMeasureGeometry(map);
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
