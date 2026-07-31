// js/filter.js
let globalGeoData = null;

// Khởi tạo bộ lọc Dropdown
function initFilter(map, geoData) {
    globalGeoData = geoData;
    const select = document.getElementById('phuongFilter');
    const locations = new Set();

    // Thu thập các Địa chỉ/Phường Xã duy nhất từ Cột K
    geoData.features.forEach(f => {
        const diaChi = f.properties.dia_chi;
        if (diaChi) locations.add(diaChi);
    });

    // Nạp vào Dropdown
    locations.forEach(loc => {
        const opt = document.createElement('option');
        opt.value = loc;
        opt.textContent = loc;
        select.appendChild(opt);
    });

    // Khi bạn CHỦ ĐỘNG CHỌN từ Dropdown -> Mới lọc & Zoom
    select.addEventListener('change', (e) => {
        applyFilterAndZoom(map, e.target.value);
    });
}

// Hàm Lọc & Zoom khu vực (Chỉ gọi khi chọn Dropdown)
function applyFilterAndZoom(map, addressValue) {
    if (addressValue === 'ALL' || !addressValue) {
        map.setFilter('thua-dat-layer', null);
        if (globalGeoData && globalGeoData.features.length > 0) {
            const bbox = turf.bbox(globalGeoData);
            map.fitBounds(bbox, { padding: 50 });
        }
    } else {
        map.setFilter('thua-dat-layer', ['==', ['get', 'dia_chi'], addressValue]);

        const filteredFeatures = globalGeoData.features.filter(f => f.properties.dia_chi === addressValue);
        if (filteredFeatures.length > 0) {
            const fc = turf.featureCollection(filteredFeatures);
            const bbox = turf.bbox(fc);
            map.fitBounds(bbox, { padding: 50 });
        }
    }
}

// Hàm CHỈ CẬP NHẬT TÊN DROPDOWN (Khi Click thửa đất - Không Zoom/Không Lọc)
function syncDropdownOnly(addressValue) {
    const select = document.getElementById('phuongFilter');
    if (select && addressValue) {
        select.value = addressValue;
    }
}
