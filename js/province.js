// js/province.js

// Biến toàn cục lưu trữ dữ liệu ranh giới GeoJSON của tỉnh đang được chọn hiện tại
let currentGeoData = null;

/**
 * 1. HÀM CHỌN PHƯỜNG/XÃ TỪ TỌA ĐỘ CLICK TRÊN BẢN ĐỒ
 */
async function selectPhuongFromPoint(lng, lat, map) {
    const tinhSelect = document.getElementById('tinhFilter');
    const phuongSelect = document.getElementById('phuongFilter');

    if (!tinhSelect.value && CONFIG.PROVINCES.length > 0) {
        const defaultProvince = CONFIG.PROVINCES[0];
        tinhSelect.value = defaultProvince.id;
        await loadProvinceData(defaultProvince.id, map);
    }

    if (!currentGeoData || !currentGeoData.features) return;

    const point = turf.point([lng, lat]);
    let matchedPhuong = null;

    for (const feature of currentGeoData.features) {
        if (turf.booleanPointInPolygon(point, feature)) {
            const p = feature.properties || {};
            matchedPhuong = p.name || p.dia_chi || p.Phuong || p.Xa || p.NAME_2 || p.NAME_3;
            if (matchedPhuong) break;
        }
    }

    if (matchedPhuong && phuongSelect) {
        if (phuongSelect.value !== matchedPhuong) {
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
 * 2. HÀM TẢI DỮ LIỆU RANH GIỚI TỈNH KHI CHỌN TỪ DROPDOWN
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

    const showAllProvinceFilter = ['!=', '$type', 'Point']; 
    if (map.getLayer('thua-dat-layer')) map.setFilter('thua-dat-layer', showAllProvinceFilter);
    if (map.getLayer('thua-dat-line-layer')) map.setFilter('thua-dat-line-layer', showAllProvinceFilter);

    phuongSelect.disabled = false;
    Array.from(phuongSet).sort().forEach(pName => {
        const opt = document.createElement('option');
        opt.value = pName;
        opt.textContent = pName;
        phuongSelect.appendChild(opt);
    });
}

/**
 * 3. HÀM KHỞI TẠO BỘ LỌC (GẮN SỰ KIỆN CHO CÁC DROPDOWN TỈNH & XÃ)
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

    tinhSelect.addEventListener('change', async (e) => {
        const selectedTinh = e.target.value;
        if (!selectedTinh) {
            hideThuaDat(map);
            currentGeoData = null;
            phuongSelect.innerHTML = '<option value="">-- Phường / Xã --</option>';
            phuongSelect.disabled = true;
        } else {
            await loadProvinceData(selectedTinh, map);
        }
    });

    phuongSelect.addEventListener('change', (e) => {
        const selectedPhuong = e.target.value;

        if (!selectedPhuong) {
            const showAllProvinceFilter = ['!=', '$type', 'Point'];
            if (map.getLayer('thua-dat-layer')) map.setFilter('thua-dat-layer', showAllProvinceFilter);
            if (map.getLayer('thua-dat-line-layer')) map.setFilter('thua-dat-line-layer', showAllProvinceFilter);
            
            if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', ['==', '$type', 'Point']);
            if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', ['==', '$type', 'Point']);
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

/**
 * 4. TÍNH NĂNG TÌM KIẾM TOÀN QUỐC (CÓ NÚT BẤM RIÊNG BIỆT, TỰ ĐỘNG NẠP SẴN DỮ LIỆU)
 */
function handleGlobalSearch() {
    const searchInput = document.getElementById('searchInput');
    const mapInstance = window.currentMapInstance;
    if (!searchInput || !mapInstance) return;

    const keyword = searchInput.value.trim().toLowerCase();

    // Nếu ô tìm kiếm trống, reset lại bộ lọc hiển thị thửa đất
    if (!keyword) {
        const emptyFilter = ['==', '$type', 'Point'];
        if (mapInstance.getLayer('sheet-thua-dat-fill')) mapInstance.setFilter('sheet-thua-dat-fill', emptyFilter);
        if (mapInstance.getLayer('sheet-thua-dat-line')) mapInstance.setFilter('sheet-thua-dat-line', emptyFilter);
        return;
    }

    // Biểu thức lọc MapLibre trên toàn bộ nguồn dữ liệu (hỗ trợ số tờ, số thửa, tên chủ, mã định danh, ID)
    const searchFilter = [
        'any',
        ['==', ['to-string', ['coalesce', ['get', 'Số tờ'], ['get', 'So to'], ['get', 'so_to'], '']], keyword],
        ['==', ['to-string', ['coalesce', ['get', 'Số thửa'], ['get', 'So thua'], ['get', 'so_thua'], '']], keyword],
        ['in', keyword, ['downcase', ['coalesce', ['get', 'Tên Chủ'], ['get', 'Tên chủ'], ['get', 'ten_chu'], ']]],
        ['in', keyword, ['downcase', ['coalesce', ['get', 'Số định danh chủ đất'], ['get', 'Số định danh'], ['get', 'so_dinh_danh'], ']]],
        ['in', keyword, ['downcase', ['coalesce', ['get', 'ID Thửa Đất'], ['get', 'id'], '']]]
    ];

    if (mapInstance.getLayer('sheet-thua-dat-fill')) {
        mapInstance.setFilter('sheet-thua-dat-fill', searchFilter);
    }
    if (mapInstance.getLayer('sheet-thua-dat-line')) {
        mapInstance.setFilter('sheet-thua-dat-line', searchFilter);
    }

    // Quét dữ liệu trong source để tính toán khung bao (bounding box) cho toàn bộ kết quả tìm thấy trên cả nước và zoom tới
    const source = mapInstance.getSource('sheet-thua-dat-src');
    if (source && source._data && source._data.features) {
        const matchedFeatures = source._data.features.filter(f => {
            const p = f.properties || {};
            const sTo = String(p['Số tờ'] || p['So to'] || p['so_to'] || '').trim().toLowerCase();
            const sThua = String(p['Số thửa'] || p['So thua'] || p['so_thua'] || '').trim().toLowerCase();
            const ten = String(p['Tên Chủ'] || p['Tên chủ'] || p['ten_chu'] || '').toLowerCase();
            const dinhDanh = String(p['Số định danh chủ đất'] || p['Số định danh'] || p['so_dinh_danh'] || '').toLowerCase();
            const idThua = String(p['ID Thửa Đất'] || p['id'] || '').toLowerCase();

            return sTo === keyword || 
                   sThua === keyword || 
                   ten.includes(keyword) || 
                   dinhDanh.includes(keyword) || 
                   idThua.includes(keyword);
        });

        if (matchedFeatures.length > 0) {
            const fc = turf.featureCollection(matchedFeatures);
            const bbox = turf.bbox(fc);
            mapInstance.fitBounds(bbox, { padding: 50, maxZoom: 18, duration: 1000 });
        } else {
            alert("Không tìm thấy kết quả phù hợp với từ khóa: " + keyword);
        }
    }
}

// Khởi chạy tự động nạp dữ liệu Google Sheets ngầm ngay khi load trang & gắn sự kiện cho nút tìm kiếm
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => {
        const mapInstance = window.currentMapInstance;
        if (mapInstance) {
            // Tự động nạp sẵn toàn bộ dữ liệu thửa đất từ Google Sheets ngay từ đầu để sẵn sàng tìm kiếm toàn quốc
            await loadThuaDatFromSheet(mapInstance);
        }

        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        // Cho phép bấm Enter trong ô input cũng kích hoạt tìm kiếm luôn cho tiện
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.keyCode === 13) {
                handleGlobalSearch();
            }
        });

        // Tìm hoặc tự động gắn sự kiện click cho Nút Tìm Kiếm (giả sử nút tìm kiếm có id là 'searchBtn' hoặc class tương ứng)
        let searchBtn = document.getElementById('searchBtn') || document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', handleGlobalSearch);
        }
    }, 500);
});
```[cite: 6]
