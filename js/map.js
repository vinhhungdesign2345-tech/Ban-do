// ==========================================
// FILE: js/map.js (Toàn bộ code chuẩn)
// ==========================================

// Định dạng số chuẩn Việt Nam: 1.234,5
function formatNumberVN(val) {
    if (val === null || val === undefined || val === '' || val === '-') return '-';
    
    const num = parseFloat(String(val).replace(',', '.'));
    if (isNaN(num)) return val;

    return num.toLocaleString('vi-VN');
}

// Hàm đóng bảng thông tin phía dưới màn hình và xóa trạng thái làm nổi bật (highlight) thửa đất
function closeParcelPanel() {
    const panel = document.getElementById('parcel-info-panel');
    if (panel) panel.style.display = 'none';

    const mapInstance = window.currentMapInstance;
    if (mapInstance) {
        if (mapInstance.getLayer('sheet-thua-dat-highlight-fill')) {
            mapInstance.setFilter('sheet-thua-dat-highlight-fill', ['==', ['get', 'ID Thửa Đất'], '']);
        }
        if (mapInstance.getLayer('sheet-thua-dat-highlight-line')) {
            mapInstance.setFilter('sheet-thua-dat-highlight-line', ['==', ['get', 'ID Thửa Đất'], '']);
        }
    }
}

// Hàm xử lý riêng khi chọn Việt Nam (Zoom toàn quốc)
function zoomToVietNam(map) {
    map.flyTo({
        center: [106.5, 16.0], // Tọa độ trung tâm Việt Nam
        zoom: 5.5,             // Mức zoom phù hợp để thấy cả nước
        essential: true
    });
}

function initMap() {
    // Khởi tạo đối tượng bản đồ MapLibre GL gắn vào thẻ div có id là 'map'
    const map = new maplibregl.Map({
        container: 'map',
        style: CONFIG.MAP_STYLE,
        center: CONFIG.MAP_CENTER,
        zoom: CONFIG.MAP_ZOOM
    });

    // Lưu trữ instance của bản đồ ra biến toàn cục window
    window.currentMapInstance = map;

    // 📍 TÍCH HỢP NÚT ĐỊNH VỊ VỚI CẤU HÌNH GPS PHẦN CỨNG
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
        
        console.log("Vị trí GPS hiện tại:", lng, lat);

        if (typeof selectPhuongFromPoint === 'function') {
            await selectPhuongFromPoint(lng, lat, map);
        }
    });

    // Sự kiện chờ bản đồ tải xong
    map.on('load', () => {
        // Thêm Source và Layer riêng cho ranh giới Việt Nam (nếu cần hiển thị nền ranh giới tỉnh)
        if (!map.getSource('vietnam-boundary-source')) {
            map.addSource('vietnam-boundary-source', {
                type: 'geojson',
                data: './geojson/Viet-Nam.json'
            });

            map.addLayer({
                id: 'vietnam-boundary-layer',
                type: 'line',
                source: 'vietnam-boundary-source',
                paint: {
                    'line-color': '#007cbf',
                    'line-width': 1.5,
                    'line-opacity': 0.8
                }
            });
        }

        initFilter(map);          // Khởi tạo bộ lọc tỉnh/xã
        initThuaDatSearch(map);   // Khởi tạo chức năng tìm kiếm thửa đất

        // 🔗 LẮNG NGHE SỰ KIỆN THAY ĐỔI TỪ DROPDOWN CHỌN TỈNH / VIỆT NAM
        const provinceSelect = document.getElementById('province-select') || document.getElementById('tinh-select');
        if (provinceSelect) {
            provinceSelect.addEventListener('change', (e) => {
                const selectedValue = e.target.value;
                if (selectedValue === "VietNam" || selectedValue.toLowerCase().includes("việt nam")) {
                    zoomToVietNam(map);
                }
            });
        }
    });

    const sheetLayers = ['sheet-thua-dat-fill', 'sheet-thua-dat-line'];
    let isFeatureClicked = false;

    sheetLayers.forEach(layerId => {
        map.on('click', layerId, (e) => {
            if (!e.features || !e.features.length) return;

            isFeatureClicked = true;

            const selectedFeature = e.features[0];
            const rawProps = selectedFeature.properties || {};

            const soTo = rawProps['Số tờ'] || rawProps['So to'] || '-';
            const soThua = rawProps['Số thửa'] || rawProps['So thua'] || '-';
            
            const rawDienTich = rawProps['Diện tích'] || rawProps['Dien tich'] || '-';
            const dienTich = formatNumberVN(rawDienTich);

            const loaiDat = rawProps['Loại Đất'] || rawProps['Loại Đất:'] || rawProps['Loại đất'] || rawProps['loai_dat'] || '-';
            const tenChu = rawProps['Tên Chủ'] || rawProps['Tên chủ'] || '-';
            const soDinhDanh = rawProps['Số định danh chủ đất'] || rawProps['Số định danh'] || 'Không có';
            const ghiChu = rawProps['Ghi Chú'] || rawProps['Ghi chú'] || 'Không có';

            const parcelId = rawProps['ID Thửa Đất'] || rawProps['id'];

            let selectFilter;
            if (parcelId) {
                selectFilter = ['==', ['get', 'ID Thửa Đất'], rawProps['ID Thửa Đất'] || parcelId];
            } else {
                selectFilter = ['==', ['get', 'Tên Chủ'], rawProps['Tên Chủ'] || tenChu];
            }

            if (map.getLayer('sheet-thua-dat-highlight-fill')) {
                map.setFilter('sheet-thua-dat-highlight-fill', selectFilter);
            }
            if (map.getLayer('sheet-thua-dat-highlight-line')) {
                map.setFilter('sheet-thua-dat-highlight-line', selectFilter);
            }

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

    // SỰ KIỆN CLICK VÙNG TRỐNG TRÊN BẢN ĐỒ
    map.on('click', (e) => {
        if (!isFeatureClicked) {
            closeParcelPanel();

            if (typeof selectPhuongFromPoint === 'function') {
                selectPhuongFromPoint(e.lngLat.lng, e.lngLat.lat, map);
            }
        }
        isFeatureClicked = false;
    });
}

// Kích hoạt hàm khởi tạo bản đồ khi DOM tải xong
document.addEventListener('DOMContentLoaded', initMap);
