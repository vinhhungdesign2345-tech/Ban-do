// js/filter.js
let globalGeoData = null;

function initFilter(map, geoData) {
    globalGeoData = geoData;
    const tinhSelect = document.getElementById('tinhFilter');
    const phuongSelect = document.getElementById('phuongFilter');

    const tinhMap = new Map(); // Luu tru quan he Tinh -> Phuong/Xa

    // Bóc tách thuộc tính từ file GeoJSON (Hỗ trợ nhiều kiểu tên thuộc tính: Tinh/Quan/Phuong)
    geoData.features.forEach(f => {
        const props = f.properties;
        const tenTinh = props.tinh || props.Tinh || props.TinhThanh || "Cà Mau";
        const tenPhuong = props.dia_chi || props.Phuong || props.Quan || props.Xa;

        if (tenPhuong) {
            if (!tinhMap.has(tenTinh)) {
                tinhMap.set(tenTinh, new Set());
            }
            tinhMap.get(tenTinh).add(tenPhuong);
        }
    });

    // 1. Nạp danh sách Tỉnh vào Dropdown Tỉnh
    tinhMap.forEach((phuongSet, tinhName) => {
        const opt = document.createElement('option');
        opt.value = tinhName;
        opt.textContent = tinhName;
        tinhSelect.appendChild(opt);
    });

    // Sự kiện CHỌN TỈNH
    tinhSelect.addEventListener('change', (e) => {
        const selectedTinh = e.target.value;
        phuongSelect.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';

        if (!selectedTinh) {
            phuongSelect.disabled = true;
            map.setFilter('thua-dat-layer', ['==', '$type', 'Point']); // Filter vô lý để ẨN HOÀN TOÀN
        } else {
            phuongSelect.disabled = false;
            const listPhuong = tinhMap.get(selectedTinh);
            if (listPhuong) {
                listPhuong.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p;
                    opt.textContent = p;
                    phuongSelect.appendChild(opt);
                });
            }
        }
    });

    // Sự kiện CHỌN PHƯỜNG/XÃ (Bắt đầu hiển thị thửa đất)
    phuongSelect.addEventListener('change', (e) => {
        const selectedPhuong = e.target.value;

        if (!selectedPhuong) {
            // Ẩn hoàn toàn nếu bỏ chọn
            map.setFilter('thua-dat-layer', ['==', '$type', 'Point']);
        } else {
            // Chỉ hiển thị các thửa đất thuộc Phường/Xã được chọn
            map.setFilter('thua-dat-layer', [
                'any',
                ['==', ['get', 'dia_chi'], selectedPhuong],
                ['==', ['get', 'Phuong'], selectedPhuong],
                ['==', ['get', 'Quan'], selectedPhuong],
                ['==', ['get', 'Xa'], selectedPhuong]
            ]);

            // Zoom vừa vặn khu vực Phường/Xã đó
            const filteredFeatures = globalGeoData.features.filter(f => {
                const p = f.properties;
                return p.dia_chi === selectedPhuong || p.Phuong === selectedPhuong || p.Quan === selectedPhuong || p.Xa === selectedPhuong;
            });

            if (filteredFeatures.length > 0) {
                const fc = turf.featureCollection(filteredFeatures);
                const bbox = turf.bbox(fc);
                map.fitBounds(bbox, { padding: 50 });
            }
        }
    });
}

// Đồng bộ Dropdown khi nhấp vào thửa đất (không zoom lại)
function syncDropdownOnly(addressValue) {
    const phuongSelect = document.getElementById('phuongFilter');
    if (phuongSelect && addressValue) {
        phuongSelect.value = addressValue;
    }
}
