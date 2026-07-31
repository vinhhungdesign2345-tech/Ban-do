// js/filter.js
let currentGeoData = null;

function initFilter(map) {
    const tinhSelect = document.getElementById('tinhFilter');
    const phuongSelect = document.getElementById('phuongFilter');

    // 1. Tải danh sách Tỉnh từ CONFIG vào Dropdown
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

        // Tải dữ liệu GeoJSON của Tỉnh được chọn
        const geoData = await fetchGeoDataByUrl(provinceInfo.file);
        if (!geoData || !geoData.features) {
            alert("Chưa tải được dữ liệu file GeoJSON của tỉnh này!");
            return;
        }

        currentGeoData = geoData;

        // Thu thập danh sách Phường/Xã từ các cột dữ liệu phổ biến
        const phuongSet = new Set();
        geoData.features.forEach(f => {
            const p = f.properties || {};
            const val = p.dia_chi || p.Phuong || p.Quan || p.Xa || p.NAME_2 || p.NAME_3 || p.TenPhuong;
            if (val) phuongSet.add(String(val).trim());
        });

        // Đưa nguồn dữ liệu vào Map (Nếu chưa có thì tạo mới)
        if (map.getSource('thua-dat-src')) {
            map.getSource('thua-dat-src').setData(geoData);
        } else {
            map.addSource('thua-dat-src', { type: 'geojson', data: geoData });
            map.addLayer({
                'id': 'thua-dat-layer',
                'type': 'fill',
                'source': 'thua-dat-src',
                'filter': ['==', '$type', 'Point'], // Mặc định ẩn hoàn toàn thửa đất
                'paint': {
                    'fill-color': CONFIG.FILL_COLOR,
                    'fill-opacity': CONFIG.FILL_OPACITY,
                    'fill-outline-color': CONFIG.OUTLINE_COLOR
                }
            });
        }

        // Nạp danh sách Phường/Xã vào Dropdown thứ 2
        phuongSelect.disabled = false;
        Array.from(phuongSet).sort().forEach(pName => {
            const opt = document.createElement('option');
            opt.value = pName;
            opt.textContent = pName;
            phuongSelect.appendChild(opt);
        });

        // Bay tới trung tâm Tỉnh được chọn
        map.flyTo({ center: provinceInfo.center, zoom: 10 });
    });

    // 3. Sự kiện CHỌN PHƯỜNG/XÃ (Mới bắt đầu hiện Thửa đất)
    phuongSelect.addEventListener('change', (e) => {
        const selectedPhuong = e.target.value;

        if (!selectedPhuong) {
            hideThuaDat(map);
        } else {
            // Lọc hiển thị thửa đất thuộc Phường/Xã trên bản đồ
            map.setFilter('thua-dat-layer', [
                'any',
                ['==', ['get', 'dia_chi'], selectedPhuong],
                ['==', ['get', 'Phuong'], selectedPhuong],
                ['==', ['get', 'Quan'], selectedPhuong],
                ['==', ['get', 'Xa'], selectedPhuong],
                ['==', ['get', 'NAME_2'], selectedPhuong],
                ['==', ['get', 'NAME_3'], selectedPhuong]
            ]);

            // Zoom tới các thửa đất của Phường/Xã đó
            if (currentGeoData) {
                const filtered = currentGeoData.features.filter(f => {
                    const p = f.properties || {};
                    return p.dia_chi === selectedPhuong || p.Phuong === selectedPhuong || 
                           p.Quan === selectedPhuong || p.Xa === selectedPhuong || 
                           p.NAME_2 === selectedPhuong || p.NAME_3 === selectedPhuong;
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
