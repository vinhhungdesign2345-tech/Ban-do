// js/sheet.js

/**
 * Hàm tải dữ liệu ranh giới và thông tin thửa đất từ Google Sheets thông qua Google Apps Script Web App
 * Đã tối ưu tốc độ bằng cách lưu trữ tạm (Cache) trên LocalStorage của trình duyệt
 */
async function loadThuaDatFromSheet(map) {
    // Nếu chưa cấu hình đường dẫn URL lấy dữ liệu từ Google Sheet thì dừng lại ngay
    if (!CONFIG.SHEET_DATA_URL) return;

    try {
        let geojson = null;
        const cacheKey = 'sheet_thua_dat_cache';
        const timeKey = 'sheet_thua_dat_time';
        const cachedData = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(timeKey);
        const now = new Date().getTime();

        // Kiểm tra xem cache có tồn tại và thời gian lưu chưa quá 10 phút (600000ms) hay không
        if (cachedData && cachedTime && (now - parseInt(cachedTime) < 600000)) {
            // Lấy trực tiếp từ bộ nhớ đệm của trình duyệt để hiện lên tức thì (siêu nhanh)
            geojson = JSON.parse(cachedData);
        } else {
            // Nếu chưa có cache hoặc đã quá hạn, tiến hành gọi fetch dữ liệu mới nhất từ Google Apps Script
            const response = await fetch(CONFIG.SHEET_DATA_URL);
            geojson = await response.json(); // Chuyển đổi dữ liệu nhận được sang định dạng JSON (GeoJSON)
            
            // Lưu lại vào LocalStorage để dùng cho các lần tải sau
            localStorage.setItem(cacheKey, JSON.stringify(geojson));
            localStorage.setItem(timeKey, now.toString());
        }

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
                    'fill-opacity': 0.45                  // Độ trong suốt lớp phủ nền là 45%
                },
                'filter': ['==', '$type', 'Point']        // Ban đầu ẩn toàn bộ (chỉ lọc những điểm không tồn tại để không hiện bừa)
            });

            // 2. Thêm lớp hiển thị đường viền ranh giới các thửa đất
            map.addLayer({
                'id': 'sheet-thua-dat-line',
                'type': 'line',
                'source': 'sheet-thua-dat-src',
                'paint': {
                    'line-color': COLOR_MATCH_EXPRESSION, // Màu đường viền đồng bộ theo màu loại đất
                    'line-width': 0.8                     // Độ dày nét viền mảnh (0.8 pixel)
                },
                'filter': ['==', '$type', 'Point']        // Ban đầu ẩn toàn bộ
            });

            // 3. Thêm lớp làm nổi bật (highlight) phần nền thửa đất khi người dùng bấm chọn
            map.addLayer({
                'id': 'sheet-thua-dat-highlight-fill',
                'type': 'fill',
                'source': 'sheet-thua-dat-src',
                'paint': {
                    'fill-color': '#ffff00',              // Tô màu vàng sáng nổi bật khi chọn thửa
                    'fill-opacity': 0.65                  // Độ trong suốt màu vàng là 65%
                },
                'filter': ['==', ['get', 'ID Thửa Đất'], ''] // Ban đầu chưa chọn thửa nào nên ID rỗng
            });

            // 4. Thêm lớp làm nổi bật đường viền thửa đất khi được bấm chọn
            map.addLayer({
                'id': 'sheet-thua-dat-highlight-line',
                'type': 'line',
                'source': 'sheet-thua-dat-src',
                'paint': {
                    'line-color': '#00ffff',              // Viền màu xanh dương sáng (cyan) khi được chọn
                    'line-width': 1.8                     // Độ dày viền nổi bật (1.8 pixel)
                },
                'filter': ['==', ['get', 'ID Thửa Đất'], ''] // Ban đầu chưa chọn thửa nào nên ID rỗng
            });
        }
    } catch (error) {
        // Bắt lỗi nếu quá trình gọi dữ liệu từ Google Sheet gặp sự cố mạng hoặc lỗi cú pháp
        console.error("Lỗi khi tải dữ liệu từ Google Sheet:", error);
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
