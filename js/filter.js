// js/filter.js
let currentGeoData = null;

// Hàm tải dữ liệu thửa đất từ Google Apps Script Web App
async function loadThuaDatFromSheet(map) {
    if (!CONFIG.SHEET_DATA_URL) return;

    try {
        const response = await fetch(CONFIG.SHEET_DATA_URL);
        const geojson = await response.json();

        if (map.getSource('sheet-thua-dat-src')) {
            map.getSource('sheet-thua-dat-src').setData(geojson);
        } else {
            map.addSource('sheet-thua-dat-src', { type: 'geojson', data: geojson });

            // LAYER 1: TÔ MÀU NỀN THEO LOẠI ĐẤT (Chuẩn quy hoạch)
            map.addLayer({
                'id': 'sheet-thua-dat-fill',
                'type': 'fill',
                'source': 'sheet-thua-dat-src',
                'paint': {
                    'fill-color': [
                        'match',
                        ['get', 'Loại Đất'],
                        'Đất ở tại đô thị', '#ff70a6',
                        'Đất ở tại nông thôn', '#ff9770',
                        'Đất nuôi trồng thuỷ sản', '#70d6ff',
                        'Đất nuôi trồng thủy sản', '#70d6ff',
                        'Đất trồng cây lâu năm', '#c2e812',
                        'Đất trồng lúa', '#ffee93',
                        'Đất chuyên trồng lúa nước', '#ffee93',
                        '#ffbe0b' // Màu mặc định cho các loại đất khác
                    ],
                    'fill-opacity': 0.5 // Độ trong suốt 50% để thấy ảnh vệ tinh bên dưới
                }
            });

            // LAYER 2: ĐƯỜNG VIỀN THỬA ĐẤT (Đồng bộ màu vàng đậm / cam nét căng)
            map.addLayer({
                'id': 'sheet-thua-dat-line',
                'type': 'line',
                'source': 'sheet-thua-dat-src',
                'paint': {
                    'line-color': '#ff5400', // Đường viền màu cam chuẩn quy hoạch
                    'line-width': 1.5
                }
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

        if (!provinceId) {
            phuongSelect.disabled = true;
            hideThuaDat(map);
            return;
        }

        const provinceInfo = CONFIG.PROVINCES.find(p => p.id === provinceId);
        if (!provinceInfo) return;

        // Tải dữ liệu GeoJSON ranh giới
        const geoData = await fetchGeoDataByUrl(provinceInfo.file);
        if (!geoData || !geoData.features) {
            alert("Chưa tải được file GeoJSON!");
            return;
        }

        currentGeoData = geoData;
        const phuongSet = new Set();

        // Lấy danh sách tên Phường/Xã đưa vào dropdown
        geoData.features.forEach(f => {
            const p = f.properties || {};
            const val = p.name || p.dia_chi || p.Phuong || p.Quan || p.Xa || p.NAME_2 || p.NAME_3;
            if (val) phuongSet.add(String(val).trim());
        });

        // Nạp Nguồn dữ liệu ranh giới vào Map
        if (map.getSource('thua-dat-src')) {
            map.getSource('thua-dat-src').setData(geoData);
        } else {
            map.addSource('thua-dat-src', { type: 'geojson', data: geoData });

            map.addLayer({
                'id': 'thua-dat-layer',
                'type': 'fill',
                'source': 'thua-dat-src',
                'paint': {
                    'fill-color': '#000000',
                    'fill-opacity': 0
                }
            });

            map.addLayer({
                'id': 'thua-dat-line-layer',
                'type': 'line',
                'source': 'thua-dat-src',
                'paint': {
                    'line-color': '#ff0000',
                    'line-width': 2
                }
            });
        }

        // Đưa danh sách vào Dropdown Phường/Xã
        phuongSelect.disabled = false;
        Array.from(phuongSet).sort().forEach(pName => {
            const opt = document.createElement('option');
            opt.value = pName;
            opt.textContent = pName;
            phuongSelect.appendChild(opt);
        });

        // Tải thửa đất từ Google Sheet lên bản đồ
        await loadThuaDatFromSheet(map);

        map.flyTo({ center: provinceInfo.center, zoom: 10 });
    });

    // 3. Sự kiện CHỌN PHƯỜNG/XÃ
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
            
            // Lọc thửa đất Google Sheet theo Phường/Xã được chọn
            if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', sheetFilterExpr);
            if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', sheetFilterExpr);

            // Zoom vừa vặn khu vực Phường/Xã được chọn
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
