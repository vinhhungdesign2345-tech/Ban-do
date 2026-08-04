// js/province.js

// Biến toàn cục lưu trữ dữ liệu ranh giới GeoJSON của tỉnh đang được chọn hiện tại
let currentGeoData = null;

/**
 * 1. HÀM CHỌN PHƯỜNG/XÃ VÀ TỈNH TỪ TỌA ĐỘ CLICK TRÊN BẢN ĐỒ (TỰ ĐỘNG QUÉT TẤT CẢ CÁC TỈNH)
 * @param {number} lng - Kinh độ điểm người dùng click trên bản đồ
 * @param {number} lat - Vĩ độ điểm người dùng click trên bản đồ
 * @param {Object} map - Đối tượng hiển thị bản đồ MapLibre
 */
async function selectPhuongFromPoint(lng, lat, map) {
 // Lấy phần tử thẻ chọn Tỉnh và Phường/Xã trên giao diện
 const tinhSelect = document.getElementById('tinhFilter');
 const phuongSelect = document.getElementById('phuongFilter');
 
 // Tạo một đối tượng điểm hình học (Point) từ Turf.js dựa theo tọa độ [Kinh độ, Vĩ độ]
 const point = turf.point([lng, lat]); 

 let matchedProvince = null;
 let matchedPhuong = null;
 let targetGeoData = null;

 // Vòng lặp duyệt qua từng tỉnh được khai báo trong tệp cấu hình CONFIG.PROVINCES
 for (const provinceInfo of CONFIG.PROVINCES) {
 // Gọi hàm tải dữ liệu GeoJSON ranh giới của từng tỉnh để kiểm tra
 const geoData = await fetchGeoDataByUrl(provinceInfo.file);
 
 // Kiểm tra xem dữ liệu tỉnh có hợp lệ và chứa các đối tượng hình học (features) hay không
 if (geoData && geoData.features) {
 // Duyệt qua từng ranh giới phường/xã hoặc vùng nhỏ bên trong file GeoJSON của tỉnh đó
 for (const feature of geoData.features) {
 // Sử dụng hàm turf.booleanPointInPolygon để kiểm tra xem điểm click có nằm bên trong vùng ranh giới này không
 if (turf.booleanPointInPolygon(point, feature)) {
 matchedProvince = provinceInfo; // Lưu lại thông tin tỉnh khớp
 targetGeoData = geoData; // Lưu lại dữ liệu GeoJSON của tỉnh đó
 
 // Lấy các thuộc tính tên địa danh từ đối tượng GeoJSON tương ứng
 const p = feature.properties || {};
 matchedPhuong = p.name || p.dia_chi || p.Phuong || p.Xa || p.NAME_2 || p.NAME_3;
 break; // Thoát vòng lặp con khi đã tìm thấy vùng chứa điểm click
 }
 }
 }
 if (matchedProvince) break; // Thoát vòng lặp lớn ngay khi tìm thấy tỉnh chính xác
 }

 // Nếu hệ thống tìm thấy tỉnh và dữ liệu ranh giới phù hợp với vị trí click
 if (matchedProvince && targetGeoData) {
 // Nếu tỉnh hiện tại trên giao diện khác với tỉnh vừa quét được, tiến hành cập nhật lại
 if (tinhSelect.value !== matchedProvince.id) {
 tinhSelect.value = matchedProvince.id; // Gán giá trị tỉnh vào thẻ select giao diện
 currentGeoData = targetGeoData; // Lưu dữ liệu ranh giới tỉnh vào biến toàn cục

 // Kiểm tra xem nguồn dữ liệu 'thua-dat-src' trên bản đồ đã tồn tại chưa
 if (map.getSource('thua-dat-src')) {
 // Nếu có rồi thì cập nhật dữ liệu ranh giới mới vào nguồn
 map.getSource('thua-dat-src').setData(targetGeoData);
 } else {
 // Nếu chưa có thì thêm mới nguồn dữ liệu GeoJSON vào bản đồ
 map.addSource('thua-dat-src', { type: 'geojson', data: targetGeoData });
 
 // Thêm lớp tô nền ranh giới tỉnh (mặc định để trong suốt opacity = 0)
 map.addLayer({
 'id': 'thua-dat-layer',
 'type': 'fill',
 'source': 'thua-dat-src',
 'paint': { 'fill-color': '#000000', 'fill-opacity': 0 }
 });
 
 // Thêm lớp hiển thị đường viền ranh giới tỉnh (màu đỏ)
 map.addLayer({
 'id': 'thua-dat-line-layer',
 'type': 'line',
 'source': 'thua-dat-src',
 'paint': { 'line-color': '#ff0000', 'line-width': 2 }
 });
 }

 // Làm sạch và thiết lập lại danh sách các tùy chọn Phường/Xã cho dropdown tương ứng
 phuongSelect.innerHTML = '<option value="">-- Phường / Xã --</option>';
 phuongSelect.disabled = false; // Kích hoạt cho phép chọn dropdown phường/xã
 
 const phuongSet = new Set(); // Dùng Set để lọc bỏ các tên phường/xã bị trùng lặp
 
 // Quét toàn bộ đối tượng trong file GeoJSON để thu thập tên các phường/xã
 targetGeoData.features.forEach(f => {
 const p = f.properties || {};
 const val = p.name || p.dia_chi || p.Phuong || p.Quan || p.Xa || p.NAME_2 || p.NAME_3;
 if (val) phuongSet.add(String(val).trim());
 });
 
 // Sắp xếp thứ tự tên phường/xã theo bảng chữ cái và đưa vào các thẻ option
 Array.from(phuongSet).sort().forEach(pName => {
 const opt = document.createElement('option');
 opt.value = pName;
 opt.textContent = pName;
 phuongSelect.appendChild(opt);
 });

 // Gọi hàm tải dữ liệu thửa đất từ Google Sheets lên bản đồ tương ứng với tỉnh vừa chọn
 await loadThuaDatFromSheet(map);
 }

 // Nếu tìm thấy tên Phường/Xã cụ thể, tự động chọn nó trên dropdown
 if (matchedPhuong && phuongSelect) {
 phuongSelect.value = matchedPhuong;
 
 // Thiết lập biểu thức lọc ranh giới tỉnh chỉ hiển thị đúng khu vực của phường đó
 const filterExpr = [
 'any',
 ['==', ['get', 'name'], matchedPhuong],
 ['==', ['get', 'dia_chi'], matchedPhuong],
 ['==', ['get', 'Phuong'], matchedPhuong],
 ['==', ['get', 'Xa'], matchedPhuong]
 ];
 
 // Thiết lập biểu thức lọc dữ liệu thửa đất từ Google Sheets theo tên phường tương ứng
 const sheetFilterExpr = [
 '==', ['get', 'Địa Chỉ Thửa Đất'], matchedPhuong
 ];

 // Áp dụng bộ lọc hiển thị lên các lớp bản đồ tương ứng
 if (map.getLayer('thua-dat-layer')) map.setFilter('thua-dat-layer', filterExpr);
 if (map.getLayer('thua-dat-line-layer')) map.setFilter('thua-dat-line-layer', filterExpr);
 if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', sheetFilterExpr);
 if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', sheetFilterExpr);
 }
 }
}

/**
 * 2. HÀM TẢI DỮ LIỆU RANH GIỚI TỈNH KHI NGƯỜI DÙNG CHỌN TRỰC TIẾP TỪ DROPDOWN GIAO DIỆN
 * @param {string} provinceId - Mã định danh (ID) của tỉnh được chọn từ thẻ select
 * @param {Object} map - Đối tượng bản đồ MapLibre
 */
async function loadProvinceData(provinceId, map) {
 // Lấy phần tử dropdown chọn Phường/Xã
 const phuongSelect = document.getElementById('phuongFilter');
 phuongSelect.innerHTML = '<option value="">-- Phường / Xã --</option>'; // Đặt lại giá trị mặc định ban đầu cho dropdown xã

 hideThuaDat(map); // Gọi hàm ẩn các lớp dữ liệu thửa đất cũ đi để làm sạch bản đồ

 // Nếu người dùng không chọn tỉnh nào (chọn dòng trống đầu tiên)
 if (!provinceId) {
 phuongSelect.disabled = true; // Vô hiệu hóa ô chọn phường/xã
 currentGeoData = null; // Xóa dữ liệu ranh giới hiện tại
 return;
 }

 // Tìm kiếm thông tin tỉnh tương ứng trong cấu hình CONFIG.PROVINCES dựa vào ID
 const provinceInfo = CONFIG.PROVINCES.find(p => p.id === provinceId);
 if (!provinceInfo) return;

 // Tải nội dung file GeoJSON ranh giới của tỉnh thông qua đường dẫn URL cấu hình
 const geoData = await fetchGeoDataByUrl(provinceInfo.file); 
 if (!geoData || !geoData.features) {
 alert("Chưa tải được file GeoJSON!"); // Thông báo lỗi nếu không tải được tệp dữ liệu
 return;
 }

 currentGeoData = geoData; // Lưu trữ dữ liệu GeoJSON vừa tải vào biến toàn cục để dùng chung
 const phuongSet = new Set(); // Khởi tạo tập hợp Set để lọc danh sách tên phường/xã không trùng lặp

 // Quét qua từng đối tượng trong file GeoJSON để thu thập tên các đơn vị hành chính cấp xã/phường
 geoData.features.forEach(f => {
 const p = f.properties || {};
 const val = p.name || p.dia_chi || p.Phuong || p.Quan || p.Xa || p.NAME_2 || p.NAME_3;
 if (val) phuongSet.add(String(val).trim());
 });

 // Thêm hoặc cập nhật nguồn dữ liệu (source) và các lớp hiển thị (layers) ranh giới tỉnh vào bản đồ
 if (map.getSource('thua-dat-src')) {
 map.getSource('thua-dat-src').setData(geoData);
 } else {
 map.addSource('thua-dat-src', { type: 'geojson', data: geoData });

 // Thêm lớp tô màu nền ranh giới tỉnh (để trong suốt với độ mờ fill-opacity = 0)
 map.addLayer({
 'id': 'thua-dat-layer',
 'type': 'fill',
 'source': 'thua-dat-src',
 'paint': { 'fill-color': '#000000', 'fill-opacity': 0 }
 });

 // Thêm lớp hiển thị đường viền ranh giới tỉnh (màu đỏ, độ dày 2px)
 map.addLayer({
 'id': 'thua-dat-line-layer',
 'type': 'line',
 'source': 'thua-dat-src',
 'paint': { 'line-color': '#ff0000', 'line-width': 2 }
 });
 }

 // Thiết lập bộ lọc hiển thị toàn bộ ranh giới của tỉnh vừa chọn (loại bỏ các điểm ẩn kiểu Point nếu có)
 const showAllProvinceFilter = ['!=', '$type', 'Point']; 
 if (map.getLayer('thua-dat-layer')) map.setFilter('thua-dat-layer', showAllProvinceFilter);
 if (map.getLayer('thua-dat-line-layer')) map.setFilter('thua-dat-line-layer', showAllProvinceFilter);

 // Sử dụng thư viện Turf.js (turf.bbox) để tính toán khung bao trọn vẹn ranh giới tỉnh vừa chọn
 try {
 const bbox = turf.bbox(geoData);
 map.fitBounds(bbox, { padding: 50, maxZoom: 15 }); // Tự động zoom màn hình ôm khít tỉnh với lề đệm 50px
 } catch (err) {
 console.error("Lỗi tự động zoom khung tỉnh:", err);
 }

 phuongSelect.disabled = false; // Kích hoạt lại ô chọn Phường/Xã cho phép người dùng thao tác tiếp
 
 // Sắp xếp tên phường/xã theo bảng chữ cái A-Z và đưa vào thẻ select dưới dạng các option tùy chọn
 Array.from(phuongSet).sort().forEach(pName => {
 const opt = document.createElement('option');
 opt.value = pName;
 opt.textContent = pName;
 phuongSelect.appendChild(opt);
 });

 await loadThuaDatFromSheet(map); // Gọi hàm tải dữ liệu thửa đất tương ứng từ Google Sheets lên bản đồ
}

/**
 * 3. HÀM KHỞI TẠO VÀ GẮN SỰ KIỆN CHO CÁC DROPDOWN BỘ LỌC (TỈNH & XÃ)
 * @param {Object} map - Đối tượng bản đồ MapLibre
 */
function initFilter(map) {
 // Lấy tham chiếu đến hai thẻ select chọn Tỉnh và Phường trên giao diện HTML
 const tinhSelect = document.getElementById('tinhFilter');
 const phuongSelect = document.getElementById('phuongFilter');

 tinhSelect.innerHTML = '<option value="">-- Tỉnh / TP --</option>'; // Đặt nhãn mặc định cho dropdown tỉnh
 
 // Vòng lặp duyệt qua danh sách cấu hình tỉnh trong CONFIG.PROVINCES để đổ dữ liệu vào thẻ select
 CONFIG.PROVINCES.forEach(p => {
 const opt = document.createElement('option');
 opt.value = p.id; // Giá trị option là mã ID của tỉnh
 opt.textContent = p.name; // Tên hiển thị của tỉnh trên giao diện
 tinhSelect.appendChild(opt);
 });

 // Lắng nghe sự kiện 'change' khi người dùng thay đổi lựa chọn ở dropdown Tỉnh/Thành phố
 tinhSelect.addEventListener('change', (e) => {
 const selectedProvinceId = e.target.value; // Lấy mã ID tỉnh vừa được chọn
 loadProvinceData(selectedProvinceId, map); // Gọi hàm tải dữ liệu ranh giới và danh sách xã tương ứng
 });

 // Lắng nghe sự kiện 'change' khi người dùng thay đổi lựa chọn ở dropdown Phường/Xã cụ thể
 phuongSelect.addEventListener('change', (e) => {
 const selectedPhuong = e.target.value; // Lấy tên phường/xã vừa được chọn

 // Kiểm tra nếu người dùng chọn lại dòng trống (bỏ chọn phường)
 if (!selectedPhuong) {
 // Hiển thị lại toàn bộ ranh giới của tỉnh và hiển thị toàn bộ thửa đất của tỉnh đó
 const showAllProvinceFilter = ['!=', '$type', 'Point'];
 if (map.getLayer('thua-dat-layer')) map.setFilter('thua-dat-layer', showAllProvinceFilter);
 if (map.getLayer('thua-dat-line-layer')) map.setFilter('thua-dat-line-layer', showAllProvinceFilter);
 
 if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', ['!=', '$type', 'Point']);
 if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', ['!=', '$type', 'Point']);
 } else {
 // Thiết lập biểu thức điều kiện lọc ranh giới tỉnh chỉ hiển thị riêng cho phường/xã được chọn
 const filterExpr = [
 'any',
 ['==', ['get', 'name'], selectedPhuong],
 ['==', ['get', 'dia_chi'], selectedPhuong],
 ['==', ['get', 'Phuong'], selectedPhuong],
 ['==', ['get', 'Xa'], selectedPhuong]
 ];

 // Thiết lập biểu thức điều kiện lọc dữ liệu thửa đất từ Google Sheets cho riêng phường/xã đó
 const sheetFilterExpr = [
 '==', ['get', 'Địa Chỉ Thửa Đất'], selectedPhuong
 ];

 // Áp dụng bộ lọc vào các lớp bản đồ ranh giới và thửa đất
 if (map.getLayer('thua-dat-layer')) map.setFilter('thua-dat-layer', filterExpr);
 if (map.getLayer('thua-dat-line-layer')) map.setFilter('thua-dat-line-layer', filterExpr);
 
 if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', sheetFilterExpr);
 if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', sheetFilterExpr);

 // Tự động thu phóng (zoom) bản đồ đến khung vực bao quanh (bounding box) của phường/xã được chọn
 if (currentGeoData) {
 const filtered = currentGeoData.features.filter(f => {
 const p = f.properties || {};
 return p.name === selectedPhuong || p.dia_chi === selectedPhuong || p.Phuong === selectedPhuong || p.Xa === selectedPhuong;
 });

 if (filtered.length > 0) {
 const fc = turf.featureCollection(filtered);
 const bbox = turf.bbox(fc);
 map.fitBounds(bbox, { padding: 50 }); // Phóng to màn hình vừa vặn với ranh giới xã kèm lề đệm 50px
 }
 }
 }
 });
}
