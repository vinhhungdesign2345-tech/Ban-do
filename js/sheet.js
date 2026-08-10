// js/sheet.js

// Định nghĩa hàm bất đồng bộ (async) để tải dữ liệu thửa đất truyền vào đối tượng bản đồ (map)
async function loadThuaDatFromSheet(map) {
    // Nếu trong file cấu hình (CONFIG) chưa khai báo đường dẫn URL dữ liệu thì dừng hàm ngay
    if (!CONFIG.SHEET_DATA_URL) return;

    try {
        // Tạo biến URL kèm theo tham số thời gian (?t=...) để ép trình duyệt tải mới dữ liệu, chống lưu bộ nhớ đệm (cache) cũ
        const noCacheUrl = CONFIG.SHEET_DATA_URL + '?t=' + new Date().getTime();
        
        // Gửi yêu cầu HTTP lấy dữ liệu từ URL đã cấu hình
        const response = await fetch(noCacheUrl);
        
        // Nếu phản hồi trả về không thành công (lỗi 404, 500,...), bắn ra lỗi
        if (!response.ok) {
            throw new Error(`Lỗi tải file: ${response.statusText}`);
        }
        
        // Chuyển đổi dữ liệu phản hồi nhận được sang định dạng GeoJSON
        const geojson = await response.json();

        // Kiểm tra xem nguồn dữ liệu 'sheet-thua-dat-src' đã tồn tại trên bản đồ từ trước chưa
        if (map.getSource('sheet-thua-dat-src')) {
            // Nếu có rồi thì cập nhật dữ liệu mới nhất (GeoJSON) vào nguồn đó
            map.getSource('sheet-thua-dat-src').setData(geojson);
        } else {
            // Nếu chưa có, thêm mới nguồn dữ liệu (source) dạng geojson vào bản đồ
            map.addSource('sheet-thua-dat-src', { type: 'geojson', data: geojson });

            // 1. Thêm lớp (layer) tô màu nền cho các thửa đất
            map.addLayer({
                'id': 'sheet-thua-dat-fill',           // Tên định danh duy nhất của lớp tô màu
                'type': 'fill',                        // Kiểu hiển thị là dạng mảng màu vùng (fill polygon)
                'source': 'sheet-thua-dat-src',        // Nguồn dữ liệu liên kết đến source ở trên
                'paint': {
                    'fill-color': COLOR_MATCH_EXPRESSION, // Màu sắc lấp đầy dựa trên biểu thức quy định sẵn
                    'fill-opacity': 0.45               // Độ trong suốt của lớp màu nền (45%)
                },
                'filter': ['!=', '$type', 'Point']     // Bộ lọc ban đầu: không hiển thị các điểm đơn thuần, chỉ hiện vùng
            });

            // 2. Thêm lớp (layer) đường viền bao quanh thửa đất
            map.addLayer({
                'id': 'sheet-thua-dat-line',           // Tên định danh của lớp đường viền
                'type': 'line',                        // Kiểu hiển thị là dạng đường kẻ (line)
                'source': 'sheet-thua-dat-src',        // Nguồn dữ liệu liên kết
                'paint': {
                    'line-color': COLOR_MATCH_EXPRESSION, // Màu sắc đường viền theo biểu thức màu
                    'line-width': 0.8                  // Độ dày của nét vẽ đường viền (0.8 pixel)
                },
                'filter': ['!=', '$type', 'Point']     // Bộ lọc: loại bỏ các đối tượng dạng điểm
            });

            // 3. Thêm lớp tô màu nền đặc biệt dùng để làm nổi bật (highlight) khi người dùng chọn thửa đất
            map.addLayer({
                'id': 'sheet-thua-dat-highlight-fill',
                'type': 'fill',
                'source': 'sheet-thua-dat-src',
                'paint': {
                    'fill-color': '#e32727',           // Màu đỏ nổi bật khi chọn
                    'fill-opacity': 0.65               // Độ đậm rõ hơn một chút (65%)
                },
                'filter': ['==', ['get', 'ID Thửa Đất'], ''] // Bộ lọc ban đầu để trống ID nên sẽ không highlight thửa nào cả
            });

            // 4. Thêm lớp đường viền làm nổi bật khi người dùng chọn thửa đất
            map.addLayer({
                'id': 'sheet-thua-dat-highlight-line',
                'type': 'line',
                'source': 'sheet-thua-dat-src',
                'paint': {
                    'line-color': '#00ffff',           // Màu viền nổi bật (màu xanh dương sáng/cyan)
                    'line-width': 1.8                  // Viền dày dặn hơn (1.8 pixel)
                },
                'filter': ['==', ['get', 'ID Thửa Đất'], ''] // Bộ lọc ban đầu để trống ID
            });
        }
        
        // Sau khi tải dữ liệu xong, kiểm tra xem giao diện có đang chọn sẵn Phường/Xã nào ở ô lọc không
        const phuongSelect = document.getElementById('phuongFilter');
        if (phuongSelect && phuongSelect.value) {
            const selectedPhuong = phuongSelect.value;
            // Tạo biểu thức lọc chỉ hiển thị các thửa đất thuộc đúng Phường/Xã đang chọn
            const sheetFilterExpr = ['==', ['get', 'Địa Chỉ Thửa Đất'], selectedPhuong];
            map.setFilter('sheet-thua-dat-fill', sheetFilterExpr);
            map.setFilter('sheet-thua-dat-line', sheetFilterExpr);
        }

    } catch (error) {
        // Bắt lỗi và in ra cửa sổ Console nếu quá trình tải dữ liệu gặp sự cố
        console.error("Lỗi khi tải dữ liệu thửa đất:", error);
    }
}

// Định nghĩa hàm dùng để ẩn toàn bộ các lớp thửa đất đi khi cần thiết
function hideThuaDat(map) {
    // Tạo điều kiện lọc giả định tìm các đối tượng kiểu 'Point' không tồn tại, khiến layer bị ẩn trống
    const emptyFilter = ['==', '$type', 'Point'];
    
    // Kiểm tra và áp dụng bộ lọc ẩn cho từng lớp bản đồ liên quan nếu chúng tồn tại
    if (map.getLayer('thua-dat-layer')) map.setFilter('thua-dat-layer', emptyFilter);
    if (map.getLayer('thua-dat-line-layer')) map.setFilter('thua-dat-line-layer', emptyFilter);
    if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', emptyFilter);
    if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', emptyFilter);
}
