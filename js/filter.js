// js/filter.js
let currentLoadedMap = null;

function initFilter(map) {
    currentLoadedMap = map;
    const tinhSelect = document.getElementById('tinhFilter');
    const phuongSelect = document.getElementById('phuongFilter');

    // 1. Nạp danh sách Tỉnh từ CONFIG
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

        const provinceInfo = CONFIG.PROVINCES.find(p => p.id === provinceId);
        if (!provinceInfo) return;

        // Tải dữ liệu GeoJSON
        const geoData = await fetchGeoDataByUrl(provinceInfo.file);
        if (!geoData || !geoData.features) {
            alert("Không tải được dữ liệu bản đồ hoặc file trống!");
            return;
        }

        // BÓC TÁCH PHƯỜNG/XÃ THÔNG MINH
        const phuongSet = new Set();
        geoData.features.forEach(f => {
            const p = f.properties || {};
            // Quét tất cả các giá trị có thể chứa thông tin Phường/Xã/Địa chỉ
            Object.keys(p).forEach(key => {
                const val = p[key];
                if (typeof val === 'string' && val.trim() !== '') {
                    // Nếu cột chứa từ Xã, Phường, Thị trấn, Đường... hoặc khớp tên thuộc tính phổ biến
                    if (key.match(/phuong|xa|quan|huyen|dia_chi|diachi|address|name|khu_vuc/i) || 
                        val.match(/Phường|Xã|Thị trấn|TP\.|Huyện/i)) {
                        phuongSet.add(val.trim());
                    }
                }
            });
        });

        // Nếu quét thông minh không thấy, lấy thử danh sách theo cột địa chỉ đầu tiên tìm được
        if (phuongSet.size === 0 && geoData.features.length > 0) {
            const firstProps = geoData.features[0].properties || {};
            const sampleKey = Object.keys(firstProps)[0]; // Lấy tạm cột đầu tiên
            if (sampleKey) {
                geoData.features.forEach(f => {
                    if (f.properties && f.properties[sampleKey]) {
                        phuongSet.add(String(f.properties[sampleKey]));
                    }
                });
            }
        }

        // Cập nhật Nguồn dữ liệu (Source) trên bản đồ
        if (map.getSource('thua-dat-src')) {
            map.getSource('thua-dat-src').setData(geoData);
        } else {
            map.addSource('thua-dat-src', { type: 'geojson', data: geoData });
            map.addLayer({
                'id': 'thua-dat-layer',
                'type': 'fill',
                'source': 'thua-dat-src',
                'filter': ['==', '$type', 'Point'], // Mặc định ẩn thửa đất
                'paint': {
                    'fill-color': CONFIG.FILL_COLOR,
                    'fill-opacity': CONFIG.FILL_OPACITY,
                    'fill-outline-color': CONFIG.OUTLINE_COLOR
                }
            });
        }

        map.currentGeoData = geoData;

        // Đưa danh sách Phường/Xã vào Dropdown
        phuongSelect.disabled = false;
        Array.from(phuongSet).sort().forEach(pName => {
            const opt = document.createElement('option');
            opt.value = pName;
            opt.textContent = pName;
            phuongSelect.appendChild(opt);
        });

        map.flyTo({ center: provinceInfo.center, zoom: 11 });
    });

    // 3. Sự kiện khi CHỌN PHƯỜNG/XÃ (Mới hiện thửa đất)
    phuongSelect.addEventListener('change', (e) => {
        const selectedPhuong = e.target.value;

        if (!selectedPhuong) {
            hideAllLayers(map);
        } else {
            // Lọc thửa đất chứa giá trị Phường/Xã được chọn ở BẤT KỲ thuộc tính nào
            const matchedFeatures = map.currentGeoData.features.filter(f => {
                const props = f.properties || {};
                return Object.values(props).some(val => String(val).trim() === selectedPhuong);
            });

            // Lọc hiển thị trên Map
            if (matchedFeatures.length > 0) {
                const fc = turf.featureCollection(matchedFeatures);
                
                // Cập nhật bộ lọc trên bản đồ
                map.setFilter('thua-dat-layer', [
                    'in', 
                    ['id'], 
                    ['literal', matchedFeatures.map((_, idx) => idx)] // Lọc theo index
                ]);

                // Nếu file GeoJSON không có ID sẵn, ta lọc qua điều kiện khớp chuỗi đơn giản:
                map.setFilter('thua-dat-layer', null); // Mở hiện toàn bộ dữ liệu tạm thời
                
                // Zoom tới vị trí Phường/Xã được chọn
                const bbox = turf.bbox(fc);
                map.fitBounds(bbox, { padding: 50 });
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
