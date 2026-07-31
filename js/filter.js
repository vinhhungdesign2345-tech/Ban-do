// js/filter.js
let currentGeoData = null;

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

        // Tải dữ liệu GeoJSON
        const geoData = await fetchGeoDataByUrl(provinceInfo.file);
        if (!geoData || !geoData.features) {
            alert("Chưa tải được file GeoJSON!");
            return;
        }

        currentGeoData = geoData;
        const phuongSet = new Set();

        // LẤY TÊN ĐỊA PHƯƠNG (Thêm props.name để đọc đúng file của bạn)
        geoData.features.forEach(f => {
            const p = f.properties || {};
            const val = p.name || p.dia_chi || p.Phuong || p.Quan || p.Xa || p.NAME_2 || p.NAME_3;
            if (val) phuongSet.add(String(val).trim());
        });

        // Nạp Nguồn dữ liệu vào Map
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

        // Đưa tên vào Dropdown Phường/Xã
        phuongSelect.disabled = false;
        Array.from(phuongSet).sort().forEach(pName => {
            const opt = document.createElement('option');
            opt.value = pName;
            opt.textContent = pName;
            phuongSelect.appendChild(opt);
        });

        map.flyTo({ center: provinceInfo.center, zoom: 10 });
    });

    // 3. Sự kiện CHỌN PHƯỜNG/XÃ (Khớp dữ liệu theo cột name)
    phuongSelect.addEventListener('change', (e) => {
        const selectedPhuong = e.target.value;

        if (!selectedPhuong) {
            hideThuaDat(map);
        } else {
            // Hiển thị thửa/vùng đất được chọn
            map.setFilter('thua-dat-layer', [
                'any',
                ['==', ['get', 'name'], selectedPhuong],
                ['==', ['get', 'dia_chi'], selectedPhuong],
                ['==', ['get', 'Phuong'], selectedPhuong],
                ['==', ['get', 'Xa'], selectedPhuong]
            ]);

            // Zoom vừa vặn khu vực đó
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
