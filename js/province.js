// js/province.js

// Biến toàn cục lưu trữ dữ liệu GeoJSON ranh giới của tỉnh đang được chọn
let currentGeoData = null;

/**
 * 1. HÀM CHỌN PHƯỜNG/XÃ TỪ TỌA ĐỘ CLICK TRÊN BẢN ĐỒ
 * Dùng thư viện Turf.js để kiểm tra xem tọa độ (lng, lat) có nằm trong polygon của Phường/Xã nào không.
 */
async function selectPhuongFromPoint(lng, lat, map) {
 const tinhSelect = document.getElementById('tinhFilter');
 const phuongSelect = document.getElementById('phuongFilter');

 // Nếu chưa chọn tỉnh, tự động chọn tỉnh mặc định đầu tiên và đảm bảo đã load xong dữ liệu
 if (!tinhSelect.value && CONFIG.PROVINCES.length > 0) {
 const defaultProvince = CONFIG.PROVINCES[0];
 tinhSelect.value = defaultProvince.id;
 await loadProvinceData(defaultProvince.id, map);
 }

 // Chờ nếu dữ liệu đang được tải ngầm
 if (!currentGeoData || !currentGeoData.features) return;

 const point = turf.point([lng, lat]);
 let matchedPhuong = null;

 // Duyệt qua tất cả các polygon phường/xã để tìm điểm click nằm bên trong
 for (const feature of currentGeoData.features) {
 if (turf.booleanPointInPolygon(point, feature)) {
 const p = feature.properties || {};
 matchedPhuong = p.name || p.dia_chi || p.Phuong || p.Xa || p.NAME_2 || p.NAME_3;
 if (matchedPhuong) break;
 }
 }

 // Nếu tìm thấy phường/xã khớp, lập tức chỉ hiển thị ĐÚNG ranh giới phường đó
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
 * 2. HÀM TẢI DỮ LIỆU RANH GIỚI TỈNH (GEOJSON) VÀ ĐỔ VÀO DROPDOWN PHƯỜNG/XÃ
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

 // Mặc định ẩn toàn bộ ranh giới tỉnh
 const hideAllFilter = ['==', '$type', 'Point']; 
 if (map.getLayer('thua-dat-layer')) map.setFilter('thua-dat-layer', hideAllFilter);
 if (map.getLayer('thua-dat-line-layer')) map.setFilter('thua-dat-line-layer', hideAllFilter);

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
 * 3. HÀM KHỞI TẠO BỘ LỌC (GẮN SỰ KIỆN CHO CÁC DROPDOWN TỈNH & XÃ)
 */
async function initFilter(map) {
 const tinhSelect = document.getElementById('tinhFilter');
 const phuongSelect = document.getElementById('phuongFilter');

 tinhSelect.innerHTML = '<option value="">-- Tỉnh / TP --</option>';
 CONFIG.PROVINCES.forEach(p => {
 const opt = document.createElement('option');
 opt.value = p.id;
 opt.textContent = p.name;
 tinhSelect.appendChild(opt);
 });

 // 🚀 TỰ ĐỘNG NẠP SẴN TỈNH ĐẦU TIÊN NGAY KHI MỞ MAP ĐỂ CÓ THỂ CLICK NGAY LẬP TỨC
 if (CONFIG.PROVINCES.length > 0) {
 const defaultProvince = CONFIG.PROVINCES[0];
 tinhSelect.value = defaultProvince.id;
 await loadProvinceData(defaultProvince.id, map);
 }

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
 const hideAllFilter = ['==', '$type', 'Point'];
 if (map.getLayer('thua-dat-layer')) map.setFilter('thua-dat-layer', hideAllFilter);
 if (map.getLayer('thua-dat-line-layer')) map.setFilter('thua-dat-line-layer', hideAllFilter);
 
 if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', hideAllFilter);
 if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', hideAllFilter);
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
