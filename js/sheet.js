// js/sheet.js

/**
 * Hàm tải dữ liệu ranh giới và thông tin thửa đất từ tệp GeoJSON trên GitHub
 * Đã loại bỏ hoàn toàn cache 10 phút để cập nhật dữ liệu mới ngay lập tức
 */
async function loadThuaDatFromSheet(map) {
  // Nếu chưa cấu hình đường dẫn URL lấy dữ liệu thì dừng lại ngay
  if (!CONFIG.SHEET_DATA_URL) return;

  try {
    // Thêm tham số thời gian động (?t=...) vào cuối URL để chống cache trình duyệt và CDN của GitHub
    const noCacheUrl = CONFIG.SHEET_DATA_URL + '?t=' + new Date().getTime();

    // Tiến hành gọi fetch dữ liệu mới nhất trực tiếp từ kho lưu trữ
    const response = await fetch(noCacheUrl);
    if (!response.ok) {
      throw new Error(`Lỗi tải file: ${response.statusText}`);
    }
    const geojson = await response.json(); // Chuyển đổi dữ liệu nhận được sang định dạng JSON (GeoJSON)

    // Kiểm tra xem nguồn dữ liệu thửa đất trên bản đồ đã tồn tại hay chưa
    if (map.getSource('sheet-thua-dat-src')) {
      // Nếu đã có rồi thì cập nhật lại toàn bộ dữ liệu mới vào nguồn
      map.getSource('sheet-thua-dat-src').setData(geojson);
    } else {
      // Nếu chưa có, thêm mới nguồn dữ liệu (source) dạng GeoJSON vào bản đồ
      map.addSource('sheet-thua-dat-src', { type: 'geojson', data: geojson });

      // 1. Thêm lớp tô màu nền cho các thửa đất (sử dụng biểu thức bảng màu quy hoạch COLOR_MATCH_EXPRESSION)
      map.addLayer({
        'id': 'sheet-thua-dat-fill',
        'type': 'fill',
        'source': 'sheet-thua-dat-src',
        'paint': {
          'fill-color': COLOR_MATCH_EXPRESSION, // Màu nền theo từng loại đất quy định trong config.js
          'fill-opacity': 0.45 // Độ trong suốt lớp phủ nền là 45%
        },
        'filter': ['==', '$type', 'Point'] // Ban đầu ẩn toàn bộ (chỉ lọc những điểm không tồn tại để không hiện bừa)
      });

      // 2. Thêm lớp hiển thị đường viền ranh giới các thửa đất
      map.addLayer({
        'id': 'sheet-thua-dat-line',
        'type': 'line',
        'source': 'sheet-thua-dat-src',
        'paint': {
          'line-color': COLOR_MATCH_EXPRESSION, // Màu đường viền đồng bộ theo màu loại đất
          'line-width': 0.8 // Độ dày nét viền mảnh (0.8 pixel)
        },
        'filter': ['==', '$type', 'Point'] // Ban đầu ẩn toàn bộ
      });

      // 3. Thêm lớp làm nổi bật (highlight) phần nền thửa đất khi người dùng bấm chọn
      map.addLayer({
        'id': 'sheet-thua-dat-highlight-fill',
        'type': 'fill',
        'source': 'sheet-thua-dat-src',
        'paint': {
          'fill-color': '#ffff00', // Tô màu vàng sáng nổi bật khi chọn thửa
          'fill-opacity': 0.65 // Độ trong suốt màu vàng là 65%
        },
        'filter': ['==', ['get', 'ID Thửa Đất'], ''] // Ban đầu chưa chọn thửa nào nên ID rỗng
      });

      // 4. Thêm lớp làm nổi bật đường viền thửa đất khi được bấm chọn
      map.addLayer({
        'id': 'sheet-thua-dat-highlight-line',
        'type': 'line',
        'source': 'sheet-thua-dat-src',
        'paint': {
          'line-color': '#00ffff', // Viền màu xanh dương sáng (cyan) khi được chọn
          'line-width': 1.8 // Độ dày viền nổi bật (1.8 pixel)
        },
        'filter': ['==', ['get', 'ID Thửa Đất'], ''] // Ban đầu chưa chọn thửa nào nên ID rỗng
      });
    }
  } catch (error) {
    // Bắt lỗi nếu quá trình gọi dữ liệu gặp sự cố mạng hoặc lỗi cú pháp
    console.error("Lỗi khi tải dữ liệu thửa đất:", error);
  }
}

/**
 * Hàm ẩn toàn bộ các lớp ranh giới hành chính và dữ liệu thửa đất khỏi bản đồ
 */
function hideThuaDat(map) {
  const emptyFilter = ['==', '$type', 'Point']; // Bộ lọc rỗng (điều kiện không thỏa mãn bất kỳ đối tượng hình học nào)
  
  // Đặt lại bộ lọc về dạng rỗng cho cả 4 lớp bản đồ chính
  if (map.getLayer('thua-dat-layer')) map.setFilter('thua-dat-layer', emptyFilter);
  if (map.getLayer('thua-dat-line-layer')) map.setFilter('thua-dat-line-layer', emptyFilter);
  if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', emptyFilter);
  if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', emptyFilter);
}
