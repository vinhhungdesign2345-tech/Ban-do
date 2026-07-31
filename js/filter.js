// js/filter.js
let currentGeoData = null;

// Hàm khai báo bảng màu quy hoạch
const COLOR_MATCH_EXPRESSION = [
    'match',
    ['get', 'Loại Đất'],
    'Đất ở tại đô thị', '#ff007f',
    'Đất ở tại nông thôn', '#ff5400',
    'Đất nuôi trồng thuỷ sản', '#00b4d8',
    'Đất nuôi trồng thủy sản', '#00b4d8',
    'Đất trồng cây lâu năm', '#4b9401',
    'Đất trồng cây hàng năm khác', '#9ef01a',
    'Đất trồng lúa', '#f5e753',
    'Đất chuyên trồng lúa nước', '#ffea00',
    '#ff9e00'
];

// Hàm tải dữ liệu từ Google Sheet
async function loadThuaDatFromSheet(map) {
    if (!CONFIG.SHEET_DATA_URL) return;

    try {
        const response = await fetch(CONFIG.SHEET_DATA_URL);
        const geojson = await response.json();

        if (map.getSource('sheet-thua-dat-src')) {
            map.getSource('sheet-thua-dat-src').setData(geojson);
        } else {
            map.addSource('sheet-thua-dat-src', { type: 'geojson', data: geojson });

            // Layer Tô màu nền
            map.addLayer({
                'id': 'sheet-thua-dat-fill',
                'type': 'fill',
                'source': 'sheet-thua-dat-src',
                'paint': {
                    'fill-color': COLOR_MATCH_EXPRESSION,
                    'fill-opacity': 0.45
                },
                'filter': ['==', '$type', 'Point'] // Mặc định ẩn
            });

            // Layer Đường viền mảnh
            map.addLayer({
                'id': 'sheet-thua-dat-line',
                'type': 'line',
                'source': 'sheet-thua-dat-src',
                'paint': {
                    'line-color': COLOR_MATCH_EXPRESSION,
                    'line-width': 0.8
                },
                'filter': ['==', '$type', 'Point'] // Mặc định ẩn
            });

            // Layer Highlight khi Click
            map.addLayer({
                'id': 'sheet-thua-dat-highlight-fill',
                'type': 'fill',
                'source': 'sheet-thua-dat-src',
                'paint': {
                    'fill-color': '#ffff00',
                    'fill-opacity': 0.65
                },
                'filter': ['==', ['get', 'ID Thửa Đất'], '']
            });

            map.addLayer({
                'id': 'sheet-thua-dat-highlight-line',
                'type': 'line',
                'source': 'sheet-thua-dat-src',
                'paint': {
                    'line-color': '#00ffff',
                    'line-width': 1.8
                },
                'filter': ['==', ['get', 'ID Thửa Đất'], '']
            });
        }
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu từ Google Sheet:", error);
    }
}

// 🔴 HÀM XÁC ĐỊNH PHƯỜNG/XÃ KHI CLICK NGUYÊN BẢN ĐỒ
function selectPhuongFromPoint(lng, lat, map) {
    if (!currentGeoData || !currentGeoData.features) return;

    const point = turf.point([lng, lat]);
    let matchedPhuong = null;

    // Quét từng Polygon Phường/Xã xem điểm click có nằm bên trong không
    for (const feature of currentGeoData.features) {
        if (turf.booleanPointInPolygon(point, feature)) {
            const p = feature.properties || {};
            matchedPhuong = p.name || p.dia_chi || p.Phuong || p.Xa || p.NAME_2 || p.NAME_3;
            if (matchedPhuong) break;
        }
    }

    // Nếu tìm thấy -> Chọn tự động trên dropdown và trigger sự kiện 'change'
    if (matchedPhuong) {
        const phuongSelect = document.getElementById('phuongFilter');
        if (phuongSelect && phuongSelect.value !== matchedPhuong) {
            phuongSelect.value = matchedPhuong;
            phuongSelect.dispatchEvent(new Event('change'));
        }
    }
}

function initFilter(map) {
    const tinhSelect = document.getElementById('tinhFilter');
    const phuongSelect = document.getElementById('phuongFilter');

    tinhSelect.innerHTML = '<option value="">-- Chọn Tỉnh --</option>';
    CONFIG.PROVINCES.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        tinhSelect.appendChild(opt);
    });

    // Sự kiện CHỌN TỈNH
    tinhSelect.addEventListener('change', async (e) => {
        const provinceId = e.target.value;
        phuongSelect.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';

        hideThuaDat(map);

        if (!provinceId) {
            phuongSelect.disabled = true;
            return;
        }

        const provinceInfo = CONFIG.PROVINCES.find(p => p.id === provinceId);
        if (!provinceInfo) return;

        const geoData = await fetchGeoDataByUrl(provinceInfo.file);
        if (!geoData || !geoData.features) {
            alert("Chưa tải được file GeoJSON!");
            return;
        }

        currentGeoData = geoData;
        const phuongSet = new Set();

        geoData.features.forEach(f => {
            const p = f.properties || {};
            const val = p.name || p.dia_chi || p.Phuong || p.Quan || p.Xa || p.NAME_2 || p.NAME_3;
            if (val) phuongSet.add(String(val).trim());
        });

        if (map.getSource('thua-dat-src')) {
            map.getSource('thua-dat-src').setData(geoData);
        } else {
            map.addSource('thua-dat-src', { type: 'geojson', data: geoData });

            map.addLayer({
                'id': 'thua-dat-layer',
                'type': 'fill',
                'source': 'thua-dat-src',
                'paint': { 'fill-color': '#000000', 'fill-opacity': 0 },
                'filter': ['==', '$type', 'Point']
            });

            map.addLayer({
                'id': 'thua-dat-line-layer',
                'type': 'line',
                'source': 'thua-dat-src',
                'paint': { 'line-color': '#ff0000', 'line-width': 2 },
                'filter': ['==', '$type', 'Point']
            });
        }

        phuongSelect.disabled = false;
        Array.from(phuongSet).sort().forEach(pName => {
            const opt = document.createElement('option');
            opt.value = pName;
            opt.textContent = pName;
            phuongSelect.appendChild(opt);
        });

        await loadThuaDatFromSheet(map);
        // GIỮ NGUYÊN MỨC ZOOM
    });

    // Sự kiện CHỌN PHƯỜNG/XÃ
    phuongSelect.addEventListener('change', (e) => {
        const selectedPhuong = e.target.value;

        if (!selectedPhuong) {
            hideThuaDat(map);
        } else {
            const filterExpr = [
                'any',
                ['==', ['get', 'name'], selectedPhuong],
                ['==', ['get', 'dia_chi'], selectedPhuong],
                ['==', ['get', 'Phuong'], selectedPhuong],
                ['==', ['get', 'Xa'], selectedPhuong]
            ];

            const sheetFilterExpr = [
                '==', ['get', 'Địa Chỉ Thửa Đất'], selectedPhuong
            ];

            if (map.getLayer('thua-dat-layer')) map.setFilter('thua-dat-layer', filterExpr);
            if (map.getLayer('thua-dat-line-layer')) map.setFilter('thua-dat-line-layer', filterExpr);
            
            if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', sheetFilterExpr);
            if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', sheetFilterExpr);

            if (currentGeoData) {
                const filtered = currentGeoData.features.filter(f => {
                    const p = f.properties || {};
                    return p.name === selectedPhuong || p.dia_chi === selectedPhuong || p.Phuong === selectedPhuong || p.Xa === selectedPhuong;
                });

                if (filtered.length > 0) {
                    const fc = turf.featureCollection(filtered);
                    const bbox = turf.bbox(fc);
                    map.fitBounds(bbox, { padding: 50 });
                }
            }
        }
    });
}

function hideThuaDat(map) {
    const emptyFilter = ['==', '$type', 'Point'];
    if (map.getLayer('thua-dat-layer')) map.setFilter('thua-dat-layer', emptyFilter);
    if (map.getLayer('thua-dat-line-layer')) map.setFilter('thua-dat-line-layer', emptyFilter);
    if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', emptyFilter);
    if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', emptyFilter);
}
