// js/province.js

// Biến toàn cục lưu trữ dữ liệu ranh giới GeoJSON của tỉnh hoặc toàn quốc đang được chọn
let currentGeoData = null;

/**
 * 1. HÀM CHỌN PHƯỜNG/XÃ VÀ TỈNH TỪ TỌA ĐỘ CLICK TRÊN BẢN ĐỒ (TỰ ĐỘNG QUÉT TẤT CẢ CÁC TỈNH)
 * @param {number} lng - Kinh độ điểm người dùng click trên bản đồ
 * @param {number} lat - Vĩ độ điểm người dùng click trên bản đồ
 * @param {Object} map - Đối tượng hiển thị bản đồ MapLibre
 */
async function selectPhuongFromPoint(lng, lat, map) {
    const tinhSelect = document.getElementById('tinhFilter');
    const phuongSelect = document.getElementById('phuongFilter');
    const point = turf.point([lng, lat]); 

    let matchedProvince = null;
    let matchedPhuong = null;
    let targetGeoData = null;

    for (const provinceInfo of CONFIG.PROVINCES) {
        if (provinceInfo.id === 'VN') continue;

        const geoData = await fetchGeoDataByUrl(provinceInfo.file);
        if (geoData && geoData.features) {
            for (const feature of geoData.features) {
                if (turf.booleanPointInPolygon(point, feature)) {
                    matchedProvince = provinceInfo;
                    targetGeoData = geoData;
                    
                    const p = feature.properties || {};
                    matchedPhuong = p.name || p.dia_chi || p.Phuong || p.Xa || p.NAME_2 || p.NAME_3;
                    break;
                }
            }
        }
        if (matchedProvince) break;
    }

    if (matchedProvince && targetGeoData) {
        if (tinhSelect.value !== matchedProvince.id) {
            tinhSelect.value = matchedProvince.id;
            currentGeoData = targetGeoData;

            if (map.getSource('thua-dat-src')) {
                map.getSource('thua-dat-src').setData(targetGeoData);
            } else {
                map.addSource('thua-dat-src', { type: 'geojson', data: targetGeoData });
                
                map.addLayer({
                    'id': 'thua-dat-layer',
                    'type': 'fill',
                    'source': 'thua-dat-src',
                    'paint': { 'fill-color': '#000000', 'fill-opacity': 0 }
                });
                
                map.addLayer({
                    'id': 'thua-dat-line-layer',
                    'type': 'line',
                    'source': 'thua-dat-src',
                    'paint': { 'line-color': '#ff0000', 'line-width': 2 }
                });
            }

            phuongSelect.innerHTML = '<option value="">-- Phường / Xã --</option>';
            phuongSelect.disabled = false;
            
            const phuongSet = new Set();
            targetGeoData.features.forEach(f => {
                const p = f.properties || {};
                const val = p.name || p.dia_chi || p.Phuong || p.Quan || p.Xa || p.NAME_2 || p.NAME_3;
                if (val) phuongSet.add(String(val).trim());
            });
            
            Array.from(phuongSet).sort().forEach(pName => {
                const opt = document.createElement('option');
                opt.value = pName;
                opt.textContent = pName;
                phuongSelect.appendChild(opt);
            });

            await loadThuaDatFromSheet(map);
        }

        if (matchedPhuong && phuongSelect) {
            phuongSelect.value = matchedPhuong;
            
            const filterExpr = [
                'any',
                ['==', ['get', 'name'], matchedPhuong],
                ['==', ['get', 'dia_chi'], matchedPhuong],
                ['==', ['get', 'Phuong'], matchedPhuong],
                ['==', ['get', 'Xa'], matchedPhuong]
            ];
            
            const sheetFilterExpr = [
                '==', ['get', 'Địa Chỉ Thửa Đất'], matchedPhuong
            ];

            if (map.getLayer('thua-dat-layer')) map.setFilter('thua-dat-layer', filterExpr);
            if (map.getLayer('thua-dat-line-layer')) map.setFilter('thua-dat-line-layer', filterExpr);
            if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', sheetFilterExpr);
            if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', sheetFilterExpr);
        }
    }
}

/**
 * 2. HÀM TẢI DỮ LIỆU RANH GIỚI TỈNH HOẶC TOÀN QUỐC KHI NGƯỜI DÙNG CHỌN TRỰC TIẾP TỪ DROPDOWN GIAO DIỆN
 * @param {string} provinceId - Mã định danh (ID) của tỉnh hoặc 'VN' được chọn từ thẻ select
 * @param {Object} map - Đối tượng bản đồ MapLibre
 */
async function loadProvinceData(provinceId, map) {
    const phuongSelect = document.getElementById('phuongFilter');
    phuongSelect.innerHTML = '<option value="">-- Phường / Xã --</option>';

    hideThuaDat(map);

    if (!provinceId) {
        phuongSelect.disabled = true;
        currentGeoData = null;
        return;
    }

    let geoData = null;
    const phuongSet = new Set();

    // 🇻🇳 XỬ LÝ KHI CHỌN "VIỆT NAM": GOM VÀ CHUẨN HÓA THUỘC TÍNH TỪNG TỈNH
    if (provinceId === 'VN') {
        const allFeatures = [];

        for (const pInfo of CONFIG.PROVINCES) {
            if (pInfo.id === 'VN' || !pInfo.file) continue;

            const pGeoData = await fetchGeoDataByUrl(pInfo.file);
            if (pGeoData && pGeoData.features) {
                pGeoData.features.forEach(f => {
                    // Sao chép thuộc tính để tránh làm hỏng dữ liệu gốc
                    const props = { ...(f.properties || {}) };
                    
                    // Gán chuẩn hóa tên Tỉnh dựa vào tên cấu hình nếu trong file chưa có trường tên tỉnh
                    props.province_name = props.NAME_1 || props.Tỉnh || pInfo.name;
                    
                    // Chuẩn hóa tên Phường/Xã chung vào trường 'standard_name'
                    props.standard_name = props.name || props.dia_chi || props.Phuong || props.Xa || props.NAME_2 || props.NAME_3;

                    f.properties = props;
                    allFeatures.push(f);

                    if (props.standard_name) {
                        phuongSet.add(String(props.standard_name).trim());
                    }
                });
            }
        }

        geoData = {
            type: 'FeatureCollection',
            features: allFeatures
        };
    } else {
        // 📍 XỬ LÝ KHI CHỌN MỘT TỈNH CỤ THỂ
        const provinceInfo = CONFIG.PROVINCES.find(p => p.id === provinceId);
        if (!provinceInfo) return;

        geoData = await fetchGeoDataByUrl(provinceInfo.file); 
        if (!geoData || !geoData.features) {
            alert("Chưa tải được file GeoJSON!");
            return;
        }

        geoData.features.forEach(f => {
            const props = { ...(f.properties || {}) };
            props.province_name = props.NAME_1 || props.Tỉnh || provinceInfo.name;
            props.standard_name = props.name || props.dia_chi || props.Phuong || props.Xa || props.NAME_2 || props.NAME_3;
            f.properties = props;

            if (props.standard_name) {
                phuongSet.add(String(props.standard_name).trim());
            }
        });
    }

    currentGeoData = geoData;

    if (map.getSource('thua-dat-src')) {
        map.getSource('thua-dat-src').setData(geoData);
    } else {
        map.addSource('thua-dat-src', { type: 'geojson', data: geoData });

        map.addLayer({
            'id': 'thua-dat-layer',
            'type': 'fill',
            'source': 'thua-dat-src',
            'paint': { 'fill-color': '#000000', 'fill-opacity': 0 }
        });

        map.addLayer({
            'id': 'thua-dat-line-layer',
            'type': 'line',
            'source': 'thua-dat-src',
            'paint': { 'line-color': '#ff0000', 'line-width': 2 }
        });

        // 🏷️ LỚP HIỂN THỊ TÊN TỈNH / THÀNH PHỐ (Zoom từ 0 đến 11)
        map.addLayer({
            'id': 'province-label-layer',
            'type': 'symbol',
            'source': 'thua-dat-src',
            'minzoom': 0,
            'maxzoom': 11,
            'layout': {
                'text-field': ['get', 'province_name'], // Đọc từ trường đã chuẩn hóa
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 13,
                'text-anchor': 'center',
                'text-allow-overlap': false
            },
            'paint': {
                'text-color': '#1d3557',
                'text-halo-color': '#ffffff',
                'text-halo-width': 2
            }
        });

        // 🏷️ LỚP HIỂN THỊ TÊN PHƯỜNG / XÃ (Zoom từ 11 trở lên)
        map.addLayer({
            'id': 'phuong-label-layer',
            'type': 'symbol',
            'source': 'thua-dat-src',
            'minzoom': 11,
            'maxzoom': 22,
            'layout': {
                'text-field': ['get', 'standard_name'], // Đọc từ trường tên xã đã chuẩn hóa
                'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
                'text-size': 11,
                'text-anchor': 'center'
            },
            'paint': {
                'text-color': '#333333',
                'text-halo-color': '#ffffff',
                'text-halo-width': 1.5
            }
        });
    }

    const showAllProvinceFilter = ['!=', '$type', 'Point']; 
    if (map.getLayer('thua-dat-layer')) map.setFilter('thua-dat-layer', showAllProvinceFilter);
    if (map.getLayer('thua-dat-line-layer')) map.setFilter('thua-dat-line-layer', showAllProvinceFilter);
    if (map.getLayer('province-label-layer')) map.setFilter('province-label-layer', showAllProvinceFilter);
    if (map.getLayer('phuong-label-layer')) map.setFilter('phuong-label-layer', showAllProvinceFilter);

    try {
        const bbox = turf.bbox(geoData);
        map.fitBounds(bbox, { padding: 50, maxZoom: 15 });
    } catch (err) {
        console.error("Lỗi tự động zoom khung bản đồ:", err);
    }

    phuongSelect.disabled = false;
    
    Array.from(phuongSet).sort().forEach(pName => {
        const opt = document.createElement('option');
        opt.value = pName;
        opt.textContent = pName;
        phuongSelect.appendChild(opt);
    });

    await loadThuaDatFromSheet(map);
}

/**
 * 3. HÀM KHỞI TẠO VÀ GẮN SỰ KIỆN CHO CÁC DROPDOWN BỘ LỌC (TỈNH & XÃ)
 * @param {Object} map - Đối tượng bản đồ MapLibre
 */
function initFilter(map) {
    const tinhSelect = document.getElementById('tinhFilter');
    const phuongSelect = document.getElementById('phuongFilter');

    tinhSelect.innerHTML = '<option value="">-- Tỉnh / TP --</option>';
    
    CONFIG.PROVINCES.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        tinhSelect.appendChild(opt);
    });

    tinhSelect.addEventListener('change', (e) => {
        const selectedProvinceId = e.target.value;
        loadProvinceData(selectedProvinceId, map);
    });

    phuongSelect.addEventListener('change', (e) => {
        const selectedPhuong = e.target.value;

        if (!selectedPhuong) {
            const showAllProvinceFilter = ['!=', '$type', 'Point'];
            if (map.getLayer('thua-dat-layer')) map.setFilter('thua-dat-layer', showAllProvinceFilter);
            if (map.getLayer('thua-dat-line-layer')) map.setFilter('thua-dat-line-layer', showAllProvinceFilter);
            if (map.getLayer('province-label-layer')) map.setFilter('province-label-layer', showAllProvinceFilter);
            if (map.getLayer('phuong-label-layer')) map.setFilter('phuong-label-layer', showAllProvinceFilter);
            
            if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', ['!=', '$type', 'Point']);
            if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', ['!=', '$type', 'Point']);
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
