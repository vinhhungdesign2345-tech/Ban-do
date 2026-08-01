// js/map.js

// 🎯 Hàm định dạng số chuẩn Việt Nam: 15348.7 -> 15.348,7
function formatNumberVN(val) {
 if (val === null || val === undefined || val === '' || val === '-') return '-';
 
 // Chuyển dấu phẩy (nếu có) thành dấu chấm để parse số
 const num = parseFloat(String(val).replace(',', '.'));
 if (isNaN(num)) return val;

 // Định dạng theo chuẩn Việt Nam (dấu . phân cách ngàn, dấu , phân cách thập phân)
 return num.toLocaleString('vi-VN');
}

function initMap() {
 const map = new maplibregl.Map({
 container: 'map',
 style: CONFIG.MAP_STYLE,
 center: CONFIG.MAP_CENTER,
 zoom: CONFIG.MAP_ZOOM
 });

 map.addControl(new maplibregl.NavigationControl(), 'top-right');

 map.on('load', () => {
 initFilter(map);
 });

 const sheetLayers = ['sheet-thua-dat-fill', 'sheet-thua-dat-line'];
 let isFeatureClicked = false; // Cờ kiểm tra click trúng thửa đất

 sheetLayers.forEach(layerId => {
 map.on('click', layerId, (e) => {
 if (!e.features || !e.features.length) return;

 isFeatureClicked = true; // Đánh dấu đã click trúng thửa đất

 const selectedFeature = e.features[0];
 const rawProps = selectedFeature.properties || {};

 // 🎯 Lấy trực tiếp các trường chính xác từ thuộc tính gốc
 const soTo = rawProps['Số tờ'] || rawProps['So to'] || '-';
 const soThua = rawProps['Số thửa'] || rawProps['So thua'] || '-';
 
 const rawDienTich = rawProps['Diện tích'] || rawProps['Dien tich'] || '-';
 const dienTich = formatNumberVN(rawDienTich);

 const loaiDat = rawProps['Loại Đất'] || rawProps['Loại Đất:'] || rawProps['Loại đất'] || rawProps['loai_dat'] || '-';
 const tenChu = rawProps['Tên Chủ'] || rawProps['Tên chủ'] || '-';
 const soDinhDanh = rawProps['Số định danh chủ đất'] || rawProps['Số định danh'] || 'Không có';
 const ghiChu = rawProps['Ghi Chú'] || rawProps['Ghi chú'] || 'Không có';

 const parcelId = rawProps['ID Thửa Đất'] || rawProps['id'];

 let selectFilter;
 if (parcelId) {
 selectFilter = ['==', ['get', 'ID Thửa Đất'], rawProps['ID Thửa Đất'] || parcelId];
 } else {
 selectFilter = ['==', ['get', 'Tên Chủ'], rawProps['Tên Chủ'] || tenChu];
 }

 if (map.getLayer('sheet-thua-dat-highlight-fill')) {
 map.setFilter('sheet-thua-dat-highlight-fill', selectFilter);
 }
 if (map.getLayer('sheet-thua-dat-highlight-line')) {
 map.setFilter('sheet-thua-dat-highlight-line', selectFilter);
 }

 // POPUP GỌN SÁT LỀ TRÁI
 const popupContent = `
 <div style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #1a1a1a; width: 150px; text-align: left;">
 <div style="display: flex; flex-direction: column; gap: 2px;">
 <div><b>Số tờ:</b> ${soTo}</div>
 <div><b>Số thửa:</b> ${soThua}</div>
 <div><b>Diện tích:</b> ${dienTich} m²</div>
 <div><b>Loại đất:</b> ${loaiDat}</div>
 <div><b>Tên chủ:</b> ${tenChu}</div>
 <div><b>Số định danh:</b> ${soDinhDanh}</div>
 <div><b>Ghi chú:</b> ${ghiChu}</div>
 </div>
 </div>
 `;

 new maplibregl.Popup({ offset: [0, -5], maxWidth: "170px" })
 .setLngLat(e.lngLat)
 .setHTML(popupContent)
 .addTo(map);
 });

 map.on('mouseenter', layerId, () => map.getCanvas().style.cursor = 'default');
 map.on('mouseleave', layerId, () => map.getCanvas().style.cursor = 'default');
 });

 // 🔴 SỰ KIỆN CLICK VÙNG TRỐNG TRÊN MAP (NHÁNH 2: Hiển thị ngay ranh giới phường được click)
 map.on('click', (e) => {
 if (!isFeatureClicked) {
 // 1. Reset highlight về màu cũ
 if (map.getLayer('sheet-thua-dat-highlight-fill')) {
 map.setFilter('sheet-thua-dat-highlight-fill', ['==', ['get', 'ID Thửa Đất'], '']);
 }
 if (map.getLayer('sheet-thua-dat-highlight-line')) {
 map.setFilter('sheet-thua-dat-highlight-line', ['==', ['get', 'ID Thửa Đất'], '']);
 }

 // 2. Chọn Phường/Xã tương ứng vị trí vừa click ngay lập tức mà không hiện cả tỉnh
 if (typeof selectPhuongFromPoint === 'function') {
 selectPhuongFromPoint(e.lngLat.lng, e.lngLat.lat, map);
 }
 }
 isFeatureClicked = false; // Reset trạng thái
 });
}

document.addEventListener('DOMContentLoaded', initMap);
