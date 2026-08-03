// js/sheet.js

async function loadThuaDatFromSheet(map) {
 if (!CONFIG.SHEET_DATA_URL) return;

 try {
 const noCacheUrl = CONFIG.SHEET_DATA_URL + '?t=' + new Date().getTime();
 const response = await fetch(noCacheUrl);
 if (!response.ok) {
 throw new Error(`Lỗi tải file: ${response.statusText}`);
 }
 const geojson = await response.json();

 if (map.getSource('sheet-thua-dat-src')) {
 map.getSource('sheet-thua-dat-src').setData(geojson);
 } else {
 map.addSource('sheet-thua-dat-src', { type: 'geojson', data: geojson });

 // 1. Thêm lớp tô màu nền
 map.addLayer({
 'id': 'sheet-thua-dat-fill',
 'type': 'fill',
 'source': 'sheet-thua-dat-src',
 'paint': {
 'fill-color': COLOR_MATCH_EXPRESSION,
 'fill-opacity': 0.45
 },
 'filter': ['!=', '$type', 'Point'] // Cho phép hiển thị toàn bộ Polygon/MultiPolygon
 });

 // 2. Thêm lớp đường viền
 map.addLayer({
 'id': 'sheet-thua-dat-line',
 'type': 'line',
 'source': 'sheet-thua-dat-src',
 'paint': {
 'line-color': COLOR_MATCH_EXPRESSION,
 'line-width': 0.8
 },
 'filter': ['!=', '$type', 'Point'] // Cho phép hiển thị toàn bộ đường viền
 });

 // 3. Lớp highlight khi chọn thửa (giữ nguyên lọc theo ID rỗng ban đầu)
 map.addLayer({
 'id': 'sheet-thua-dat-highlight-fill',
 'type': 'fill',
 'source': 'sheet-thua-dat-src',
 'paint': {
 'fill-color': '#ffff00',
 'fill-opacity': 0.65
 },
 'filter': ['==', ['get', 'ID Thửa Đất'], '']
 });

 // 4. Lớp highlight viền khi chọn thửa
 map.addLayer({
 'id': 'sheet-thua-dat-highlight-line',
 'type': 'line',
 'source': 'sheet-thua-dat-src',
 'paint': {
 'line-color': '#00ffff',
 'line-width': 1.8
 },
 'filter': ['==', ['get', 'ID Thửa Đất'], '']
 });
 }
 
 // Sau khi load xong, nếu đang chọn sẵn một xã nào đó thì cập nhật lại filter cho khớp
 const phuongSelect = document.getElementById('phuongFilter');
 if (phuongSelect && phuongSelect.value) {
 const selectedPhuong = phuongSelect.value;
 const sheetFilterExpr = ['==', ['get', 'Địa Chỉ Thửa Đất'], selectedPhuong];
 map.setFilter('sheet-thua-dat-fill', sheetFilterExpr);
 map.setFilter('sheet-thua-dat-line', sheetFilterExpr);
 }

 } catch (error) {
 console.error("Lỗi khi tải dữ liệu thửa đất:", error);
 }
}

function hideThuaDat(map) {
 const emptyFilter = ['==', '$type', 'Point'];
 if (map.getLayer('thua-dat-layer')) map.setFilter('thua-dat-layer', emptyFilter);
 if (map.getLayer('thua-dat-line-layer')) map.setFilter('thua-dat-line-layer', emptyFilter);
 if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', emptyFilter);
 if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', emptyFilter);
}
