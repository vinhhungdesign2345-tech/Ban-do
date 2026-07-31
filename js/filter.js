// js/filter.js
let currentGeoData = null;

// Hàm khai báo bảng màu quy hoạch chung cho cả Viền và Nền
const COLOR_MATCH_EXPRESSION = [
    'match',
    ['get', 'Loại Đất'],
    'Đất ở tại đô thị', '#ff007f',         // Đô thị -> Hồng thẫm
    'Đất ở tại nông thôn', '#ff5400',       // Nông thôn -> Cam đỏ
    'Đất nuôi trồng thuỷ sản', '#00b4d8',   // Thủy sản -> Xanh dương
    'Đất nuôi trồng thủy sản', '#00b4d8',   
    'Đất trồng cây lâu năm', '#70e000',     // Cây lâu năm -> Xanh lá sáng
    'Đất trồng cây hàng năm khác', '#9ef01a',
    'Đất trồng lúa', '#ffea00',             // Lúa -> Vàng tươi
    'Đất chuyên trồng lúa nước', '#ffea00', 
    '#ff9e00'                               // Khác -> Cam vàng
];

// Hàm tải dữ liệu thửa đất từ Google Apps Script Web App
async function loadThuaDatFromSheet(map) {
    if (!CONFIG.SHEET_DATA_URL) return;

    try {
        const response = await fetch(CONFIG.SHEET_DATA_URL);
        const geojson = await response.json();

        // Nguồn dữ liệu thửa đất
        if (map.getSource('sheet-thua-dat-src')) {
            map.getSource('sheet-thua-dat-src').setData(geojson);
        } else {
            map.addSource('sheet-thua-dat-src', { type: 'geojson', data: geojson });

            // LAYER 1: TÔ MÀU NỀN THEO LOẠI ĐẤT
            map.addLayer({
                'id': 'sheet-thua-dat-fill',
                'type': 'fill',
                'source': 'sheet-thua-dat-src',
                'paint': {
                    'fill-color': COLOR_MATCH_EXPRESSION,
                    'fill-opacity': 0.45 // Nền trong suốt 45% để soi rõ ảnh vệ tinh
                },
                'filter': ['==', '$type', 'Point'] // 🔴 MẶC ĐỊNH ẨN HẾT KHI MỚI TẢI XONG
            });

            // LAYER 2: ĐƯỜNG VIỀN TRÙNG MÀU VỚI NỀN
            map.addLayer({
                'id': 'sheet-thua-dat-line',
                'type': 'line',
                'source': 'sheet-thua-dat-src',
                'paint': {
                    'line-color': COLOR_MATCH_EXPRESSION, // Viền cùng màu với màu nền
                    'line-width': 1.8
                },
                'filter': ['==', '$type', 'Point'] // 🔴 MẶC ĐỊNH ẨN HẾT KHI MỚI TẢI XONG
            });

            // LAYER 3: TẠO HIỆU ỨNG NỔI BẬT DÀNH RIÊNG CHO THỬA ĐẤT ĐƯỢC CLICK CHỌN
            map.addLayer({
                'id': 'sheet-thua-dat-highlight-fill',
                'type': 'fill',
                'source': 'sheet-thua-dat-src',
                'paint': {
                    'fill-color': '#ffff00', // Đổi nền thành màu vàng chói
                    'fill-opacity': 0.65
                },
                'filter': ['==', ['get', 'ID Thửa Đất'], ''] // Mặc định không chọn thửa nào
            });

            map.addLayer({
                'id': 'sheet-thua-dat-highlight-line',
                'type': 'line',
                'source': 'sheet-thua-dat-src',
                'paint': {
                    'line-color': '#00ffff', // Viền sáng màu xanh dạ quang/cyan cực rực
                    'line-width': 3.5
                },
                'filter': ['==', ['get', 'ID Thửa Đất'], '']
            });
        }
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu từ Google Sheet:", error);
    }
}

function initFilter(map) {
    const tinhSelect = document.getElementById('tinhFilter');
    const phuongSelect = document.getElementById('phuongFilter');

    // 1. Tải danh sách Tỉnh từ CONFIG
    tinhSelect.innerHTML = '<option value="">-- Chọn Tỉnh --</option>';
    CONFIG.PROVINCES.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        tinhSelect.appendChild(opt);
    });

    // 2. Sự kiện CHỌN TỈNH
    tinhSelect.addEventListener('change', async (e) => {
        const provinceId = e.target.value;
        phuongSelect.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';

        // Khi chọn Tỉnh mới -> Luôn ẩn các thửa đất cũ đi
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
                'filter': ['==', '$type', 'Point'] // Mặc định ẩn
            });

            map.addLayer({
                'id': 'thua-dat-line-layer',
                'type': 'line',
                'source': 'thua-dat-src',
                'paint': { 'line-color': '#ff0000', 'line-width': 2 },
                'filter': ['==', '$type', 'Point'] // Mặc định ẩn
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

        // 🔴 ĐÃ BỎ LỆNH map.flyTo ĐỂ GIỮ NGUYÊN MỨC ZOOM VÀ VỊ TRÍ HIỆN TẠI
    });

    // 3. Sự kiện CHỌN PHƯỜNG/XÃ (Lúc này mới lọc và hiện các thửa đất)
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
            
            // Hiện các thửa đất của Phường/Xã được chọn (Vẫn áp dụng nguyên màu COLOR_MATCH_EXPRESSION)
            if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', sheetFilterExpr);
            if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', sheetFilterExpr);

            // Tự động khuyếch đại zoom tới Phường/Xã được chọn
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

function syncDropdownOnly(addressValue) {
    const phuongSelect = document.getElementById('phuongFilter');
    if (phuongSelect && addressValue) {
        phuongSelect.value = addressValue;
    }
}
