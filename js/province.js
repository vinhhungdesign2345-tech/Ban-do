// js/province.js

// Biến toàn cục lưu trữ dữ liệu ranh giới GeoJSON của tỉnh đang được chọn hiện tại
let currentGeoData = null;

/**
 * 1. HÀM CHỌN PHƯỜNG/XÃ TỪ TỌA ĐỘ CLICK TRÊN BẢN ĐỒ (ĐÃ TỐI ƯU SIÊU NHANH)
 */
async function selectPhuongFromPoint(lng, lat, map) {
    const tinhSelect = document.getElementById('tinhFilter');
    const phuongSelect = document.getElementById('phuongFilter');

    // Nếu người dùng chưa chọn tỉnh mà click bừa lên bản đồ, tự động gán mặc định tỉnh đầu tiên và tải dữ liệu 1 LẦN DUY NHẤT
    if (!tinhSelect.value && CONFIG.PROVINCES.length > 0) {
        const defaultProvince = CONFIG.PROVINCES[0];
        tinhSelect.value = defaultProvince.id;
        await loadProvinceData(defaultProvince.id, map);
    }

    if (!currentGeoData || !currentGeoData.features) return;

    const point = turf.point([lng, lat]); // Tạo đối tượng điểm hình học từ tọa độ [Kinh độ, Vĩ độ] người dùng vừa click
    let matchedPhuong = null;

    // Duyệt nhanh qua tất cả các vùng polygon trong GeoJSON để tìm xem điểm click nằm bên trong phường/xã nào
    for (const feature of currentGeoData.features) {
        if (turf.booleanPointInPolygon(point, feature)) {
            const p = feature.properties || {};
            // Lấy tên phường/xã từ nhiều trường thuộc tính dự phòng khác nhau của dữ liệu
            matchedPhuong = p.name || p.dia_chi || p.Phuong || p.Xa || p.NAME_2 || p.NAME_3;
            if (matchedPhuong) break; // Thoát vòng lặp ngay khi tìm thấy phường khớp
        }
    }

    // Nếu tìm thấy tên phường, cập nhật giao diện dropdown và tiến hành lọc lớp thửa đất tức thì
    if (matchedPhuong && phuongSelect) {
        if (phuongSelect.value !== matchedPhuong) {
            phuongSelect.value = matchedPhuong; // Gán giá trị mới cho ô chọn phường/xã
            
            // Biểu thức lọc ranh giới hành chính phường/xã trên bản đồ
            const filterExpr = [
                'any',
                ['==', ['get', 'name'], matchedPhuong],
                ['==', ['get', 'dia_chi'], matchedPhuong],
                ['==', ['get', 'Phuong'], matchedPhuong],
                ['==', ['get', 'Xa'], matchedPhuong]
            ];

            // Biểu thức lọc các thửa đất lấy từ Google Sheets theo địa chỉ phường/xã tương ứng
            const sheetFilterExpr = [
                '==', ['get', 'Địa Chỉ Thửa Đất'], matchedPhuong
            ];

            // Cập nhật bộ lọc trực tiếp lên các lớp bản đồ ngay lập tức không cần chờ mạng
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
    phuongSelect.innerHTML = '<option value="">-- Phường / Xã --</option>'; // Đặt lại giá trị mặc định cho dropdown phường/xã

    hideThuaDat(map); // Ẩn các lớp dữ liệu thửa đất cũ đi

    if (!provinceId) {
        phuongSelect.disabled = true; // Vô hiệu hóa dropdown phường nếu chưa chọn tỉnh
        currentGeoData = null;
        return;
    }

    const provinceInfo = CONFIG.PROVINCES.find(p => p.id === provinceId);
    if (!provinceInfo) return;

    const geoData = await fetchGeoDataByUrl(provinceInfo.file); // Tải file GeoJSON ranh giới tỉnh theo đường dẫn cấu hình
    if (!geoData || !geoData.features) {
        alert("Chưa tải được file GeoJSON!");
        return;
    }

    currentGeoData = geoData; // Lưu trữ dữ liệu GeoJSON vừa tải vào biến toàn cục
    const phuongSet = new Set(); // Sử dụng Set để lọc danh sách tên phường/xã không bị trùng lặp

    // Lọc qua từng đối tượng trong file GeoJSON để thu thập tên các phường/xã
    geoData.features.forEach(f => {
        const p = f.properties || {};
        const val = p.name || p.dia_chi || p.Phuong || p.Quan || p.Xa || p.NAME_2 || p.NAME_3;
        if (val) phuongSet.add(String(val).trim());
    });

    // Thêm nguồn dữ liệu (source) và các lớp hiển thị (layers) ranh giới tỉnh vào bản đồ MapLibre
    if (map.getSource('thua-dat-src')) {
        map.getSource('thua-dat-src').setData(geoData);
    } else {
        map.addSource('thua-dat-src', { type: 'geojson', data: geoData });

        // Lớp tô màu nền ranh giới (mặc định để trong suốt opacity = 0)
        map.addLayer({
            'id': 'thua-dat-layer',
            'type': 'fill',
            'source': 'thua-dat-src',
            'paint': { 'fill-color': '#000000', 'fill-opacity': 0 },
            'filter': ['==', '$type', 'Point']
        });

        // Lớp hiển thị đường viền ranh giới (màu đỏ)
        map.addLayer({
            'id': 'thua-dat-line-layer',
            'type': 'line',
            'source': 'thua-dat-src',
            'paint': { 'line-color': '#ff0000', 'line-width': 2 },
            'filter': ['==', '$type', 'Point']
        });
    }

    // Thiết lập bộ lọc hiển thị toàn bộ ranh giới của tỉnh vừa chọn lên bản đồ
    const showAllProvinceFilter = ['!=', '$type', 'Point']; 
    if (map.getLayer('thua-dat-layer')) map.setFilter('thua-dat-layer', showAllProvinceFilter);
    if (map.getLayer('thua-dat-line-layer')) map.setFilter('thua-dat-line-layer', showAllProvinceFilter);

    phuongSelect.disabled = false; // Kích hoạt lại ô chọn phường/xã
    // Sắp xếp thứ tự tên phường/xã theo bảng chữ cái và đưa vào thẻ select dưới dạng các option
    Array.from(phuongSet).sort().forEach(pName => {
        const opt = document.createElement('option');
        opt.value = pName;
        opt.textContent = pName;
        phuongSelect.appendChild(opt);
    });

    await loadThuaDatFromSheet(map); // Gọi hàm tải dữ liệu thửa đất từ Google Sheets lên bản đồ
}

/**
 * 3. HÀM KHỞI TẠO BỘ LỌC (GẮN SỰ KIỆN CHO CÁC DROPDOWN TỈNH & XÃ)
 */
function initFilter(map) {
    const tinhSelect = document.getElementById('tinhFilter');
    const phuongSelect = document.getElementById('phuongFilter');

    tinhSelect.innerHTML = '<option value="">-- Tỉnh / TP --</option>';
    // Đổ danh sách các tỉnh/thành phố từ file cấu hình CONFIG vào dropdown tỉnh
    CONFIG.PROVINCES.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        tinhSelect.appendChild(opt);
    });

    // Sự kiện lắng nghe khi người dùng thay đổi lựa chọn ở dropdown Tỉnh/Thành phố
    tinhSelect.addEventListener('change', async (e) => {
        const selectedTinh = e.target.value;
        if (!selectedTinh) {
            hideThuaDat(map); // Nếu bỏ chọn tỉnh thì ẩn dữ liệu thửa đất
            currentGeoData = null;
            phuongSelect.innerHTML = '<option value="">-- Phường / Xã --</option>';
            phuongSelect.disabled = true; // Khóa dropdown phường/xã lại
        } else {
            await loadProvinceData(selectedTinh, map); // Tải dữ liệu tương ứng với tỉnh được chọn
        }
    });

    // Sự kiện lắng nghe khi người dùng thay đổi lựa chọn ở dropdown Phường/Xã cụ thể
    phuongSelect.addEventListener('change', (e) => {
        const selectedPhuong = e.target.value;

        if (!selectedPhuong) {
            // Nếu bỏ chọn phường, hiển thị lại toàn bộ ranh giới của tỉnh và ẩn dữ liệu thửa đất chi tiết
            const showAllProvinceFilter = ['!=', '$type', 'Point'];
            if (map.getLayer('thua-dat-layer')) map.setFilter('thua-dat-layer', showAllProvinceFilter);
            if (map.getLayer('thua-dat-line-layer')) map.setFilter('thua-dat-line-layer', showAllProvinceFilter);
            
            if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', ['==', '$type', 'Point']);
            if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', ['==', '$type', 'Point']);
        } else {
            // Thiết lập điều kiện lọc ranh giới và thửa đất chỉ cho riêng phường/xã được chọn
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

            // Tự động thu phóng (zoom) bản đồ đến khung vực (bounding box) của phường/xã được chọn
            if (currentGeoData) {
                const filtered = currentGeoData.features.filter(f => {
                    const p = f.properties || {};
                    return p.name === selectedPhuong || p.dia_chi === selectedPhuong || p.Phuong === selectedPhuong || p.Xa === selectedPhuong;
                });

                if (filtered.length > 0) {
                    const fc = turf.featureCollection(filtered);
                    const bbox = turf.bbox(fc);
                    map.fitBounds(bbox, { padding: 50 }); // Phóng to vừa vặn với khung bao quanh phường kèm lề 50px
                }
            }
        }
    });
}
// --- TÍNH NĂNG TÌM KIẾM TOÀN CỤC (Tên chủ, số tờ/thửa, số định danh) ---
document.addEventListener('DOMContentLoaded', () => {
    // Đợi một nhịp nhỏ để chắc chắn bản đồ đã khởi tạo xong instance
    setTimeout(() => {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const keyword = e.target.value.trim().toLowerCase();
            const mapInstance = window.currentMapInstance;
            if (!mapInstance) return;

            // Nếu ô tìm kiếm trống, ẩn lớp thửa đất đi và reset bộ lọc
            if (!keyword) {
                const emptyFilter = ['==', '$type', 'Point'];
                if (mapInstance.getLayer('sheet-thua-dat-fill')) mapInstance.setFilter('sheet-thua-dat-fill', emptyFilter);
                if (mapInstance.getLayer('sheet-thua-dat-line')) mapInstance.setFilter('sheet-thua-dat-line', emptyFilter);
                return;
            }

            // Biểu thức lọc linh hoạt hỗ trợ nhiều tên trường dữ liệu khác nhau từ Google Sheets
            const searchFilter = [
                'any',
                ['==', ['to-string', ['get', 'Số tờ']], keyword],
                ['==', ['to-string', ['get', 'So to']], keyword],
                ['==', ['to-string', ['get', 'so_to']], keyword],
                ['==', ['to-string', ['get', 'Số thửa']], keyword],
                ['==', ['to-string', ['get', 'So thua']], keyword],
                ['==', ['to-string', ['get', 'so_thua']], keyword],
                ['in', keyword, ['downcase', ['coalesce', ['get', 'Tên Chủ'], ['get', 'Tên chủ'], ['get', 'ten_chu'], '']]],
                ['in', keyword, ['downcase', ['coalesce', ['get', 'Số định danh chủ đất'], ['get', 'Số định danh'], ['get', 'so_dinh_danh'], '']]],
                ['in', keyword, ['downcase', ['coalesce', ['get', 'ID Thửa Đất'], ['get', 'id'], '']]]
            ];

            // Áp dụng bộ lọc lên lớp thửa đất của bản đồ
            if (mapInstance.getLayer('sheet-thua-dat-fill')) {
                mapInstance.setFilter('sheet-thua-dat-fill', searchFilter);
            }
            if (mapInstance.getLayer('sheet-thua-dat-line')) {
                mapInstance.setFilter('sheet-thua-dat-line', searchFilter);
            }

            // 🎯 Tự động zoom đến khu vực chứa các thửa đất tìm thấy nếu nguồn dữ liệu đã sẵn sàng
            const source = mapInstance.getSource('sheet-thua-dat-src');
            if (source && source._data && source._data.features) {
                const matchedFeatures = source._data.features.filter(f => {
                    const p = f.properties || {};
                    const sTo = String(p['Số tờ'] || p['So to'] || p['so_to'] || '').toLowerCase();
                    const sThua = String(p['Số thửa'] || p['So thua'] || p['so_thua'] || '').toLowerCase();
                    const ten = String(p['Tên Chủ'] || p['Tên chủ'] || p['ten_chu'] || '').toLowerCase();
                    const dinhDanh = String(p['Số định danh chủ đất'] || p['Số định danh'] || p['so_dinh_danh'] || '').toLowerCase();
                    const idThua = String(p['ID Thửa Đất'] || p['id'] || '').toLowerCase();

                    return sTo === keyword || sThua === keyword || 
                           ten.includes(keyword) || 
                           dinhDanh.includes(keyword) || 
                           idThua.includes(keyword);
                });

                if (matchedFeatures.length > 0) {
                    const fc = turf.featureCollection(matchedFeatures);
                    const bbox = turf.bbox(fc);
                    // Thực hiện zoom mượt mà đến khung bao quanh kết quả tìm kiếm với lề đệm 50px
                    mapInstance.fitBounds(bbox, { padding: 50, maxZoom: 18, duration: 1000 });
                }
            }
        });
    }, 500);
});
