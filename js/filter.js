// js/filter.js
let currentLoadedMap = null;

function initFilter(map) {
    currentLoadedMap = map;
    const tinhSelect = document.getElementById('tinhFilter');
    const phuongSelect = document.getElementById('phuongFilter');

    // 1. Tự động nạp danh sách Tỉnh từ CONFIG vào Dropdown Tỉnh
    tinhSelect.innerHTML = '<option value="">-- Chọn Tỉnh --</option>';
    CONFIG.PROVINCES.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        tinhSelect.appendChild(opt);
    });

    // 2. Sự kiện khi CHỌN TỈNH
    tinhSelect.addEventListener('change', async (e) => {
        const provinceId = e.target.value;
        phuongSelect.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';

        if (!provinceId) {
            phuongSelect.disabled = true;
            hideAllLayers(map);
            return;
        }

        // Tìm thông tin Tỉnh được chọn
        const provinceInfo = CONFIG.PROVINCES.find(p => p.id === provinceId);
        if (!provinceInfo) return;

        // Tải dữ liệu GeoJSON của Tỉnh đó
        const geoData = await fetchGeoDataByUrl(provinceInfo.file);
        if (!geoData) return;

        // Bóc tách danh sách Phường/Xã
        const phuongSet = new Set();
        geoData.features.forEach(f => {
            const props = f.properties || {};
            const tenPhuong = props.dia_chi || props.Phuong || props.Quan || props.Xa || props.NAME_2 || props.NAME_3;
            if (tenPhuong) phuongSet.add(tenPhuong);
        });

        // Cập nhật Nguồn dữ liệu (Source) mới cho Bản đồ
        if (map.getSource('thua-dat-src')) {
            map.getSource('thua-dat-src').setData(geoData);
        } else {
            map.addSource('thua-dat-src', { type: 'geojson', data: geoData });
            map.addLayer({
                'id': 'thua-dat-layer',
                'type': 'fill',
                'source': 'thua-dat-src',
                'filter': ['==', '$type', 'Point'], // Mặc định ẩn
                'paint': {
                    'fill-color': CONFIG.FILL_COLOR,
                    'fill-opacity': CONFIG.FILL_OPACITY,
                    'fill-outline-color': CONFIG.OUTLINE_COLOR
                }
            });
        }

        // Lưu dữ liệu GeoJSON hiện tại để thực hiện lọc Phường/Xã
        map.currentGeoData = geoData;

        // Nạp danh sách Phường/Xã vào Dropdown
        phuongSelect.disabled = false;
        phuongSet.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p;
            opt.textContent = p;
            phuongSelect.appendChild(opt);
        });

        // Di chuyển góc nhìn bản đồ về trung tâm Tỉnh
        map.flyTo({ center: provinceInfo.center, zoom: 10 });
    });

    // 3. Sự kiện khi CHỌN PHƯỜNG/XÃ (Bắt đầu hiển thị thửa đất)
    phuongSelect.addEventListener('change', (e) => {
        const selectedPhuong = e.target.value;

        if (!selectedPhuong) {
            hideAllLayers(map);
        } else {
            // Hiển thị duy nhất các thửa thuộc Phường/Xã này
            map.setFilter('thua-dat-layer', [
                'any',
                ['==', ['get', 'dia_chi'], selectedPhuong],
                ['==', ['get', 'Phuong'], selectedPhuong],
                ['==', ['get', 'Quan'], selectedPhuong],
                ['==', ['get', 'Xa'], selectedPhuong],
                ['==', ['get', 'NAME_2'], selectedPhuong],
                ['==', ['get', 'NAME_3'], selectedPhuong]
            ]);

            // Zoom vừa vặn khu vực Phường/Xã đó
            if (map.currentGeoData) {
                const filtered = map.currentGeoData.features.filter(f => {
                    const p = f.properties || {};
                    return p.dia_chi === selectedPhuong || p.Phuong === selectedPhuong || p.Quan === selectedPhuong || p.Xa === selectedPhuong || p.NAME_2 === selectedPhuong || p.NAME_3 === selectedPhuong;
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

function hideAllLayers(map) {
    if (map.getLayer('thua-dat-layer')) {
        map.setFilter('thua-dat-layer', ['==', '$type', 'Point']);
    }
}

function syncDropdownOnly(addressValue) {
    const phuongSelect = document.getElementById('phuongFilter');
    if (phuongSelect && addressValue) {
        phuongSelect.value = addressValue;
    }
}
