// js/sheet.js

// --- HÀM TẢI DỮ LIỆU THỬA ĐẤT TỪ GOOGLE SHEETS VÀ HIỂN THỊ LÊN BẢN ĐỒ ---
async function loadThuaDatFromSheet(map) {
    // Nếu trong file cấu hình (CONFIG) chưa khai báo đường dẫn URL dữ liệu thì dừng hàm ngay lập tức
    if (!CONFIG.SHEET_DATA_URL) return;

    try {
        // Tạo biến URL kèm theo tham số thời gian (?t=...) để ép trình duyệt tải mới dữ liệu, chống lưu bộ nhớ đệm (cache) cũ
        const noCacheUrl = CONFIG.SHEET_DATA_URL + '?t=' + new Date().getTime();
        
        // Gửi yêu cầu HTTP GET lấy dữ liệu từ URL đã cấu hình
        const response = await fetch(noCacheUrl);
        
        // Nếu phản hồi trả về không thành công (lỗi 404, 500,...), bắn ra thông báo lỗi
        if (!response.ok) {
            throw new Error(`Lỗi tải file: ${response.statusText}`);
        }
        
        // Chuyển đổi dữ liệu phản hồi nhận được sang định dạng GeoJSON chuẩn
        const geojson = await response.json();

        // Kiểm tra xem nguồn dữ liệu 'sheet-thua-dat-src' đã tồn tại trên bản đồ từ trước hay chưa
        if (map.getSource('sheet-thua-dat-src')) {
            // Nếu có rồi thì tiến hành cập nhật tập dữ liệu GeoJSON mới nhất vào nguồn đó
            map.getSource('sheet-thua-dat-src').setData(geojson);
        } else {
            // Nếu chưa có, tiến hành thêm mới nguồn dữ liệu (source) dạng geojson vào bản đồ
            map.addSource('sheet-thua-dat-src', { type: 'geojson', data: geojson });

            // 1. Thêm lớp (layer) tô màu nền cho các thửa đất trên bản đồ
            map.addLayer({
                'id': 'sheet-thua-dat-fill',           // Tên định danh duy nhất của lớp tô màu nền
                'type': 'fill',                        // Kiểu hiển thị là dạng mảng màu vùng (fill polygon)
                'source': 'sheet-thua-dat-src',        // Nguồn dữ liệu liên kết đến source khai báo ở trên
                'paint': {
                    'fill-color': COLOR_MATCH_EXPRESSION, // Màu sắc lấp đầy dựa trên biểu thức quy định sẵn
                    'fill-opacity': 0.45               // Độ trong suốt của lớp màu nền (45%)
                },
                'filter': ['!=', '$type', 'Point']     // Bộ lọc ban đầu: không hiển thị các điểm đơn thuần, chỉ hiện vùng diện tích
            });

            // 2. Thêm lớp (layer) đường viền bao quanh ranh giới thửa đất
            map.addLayer({
                'id': 'sheet-thua-dat-line',           // Tên định danh của lớp đường viền ranh giới
                'type': 'line',                        // Kiểu hiển thị là dạng đường kẻ nét (line)
                'source': 'sheet-thua-dat-src',        // Nguồn dữ liệu liên kết
                'paint': {
                    'line-color': COLOR_MATCH_EXPRESSION, // Màu sắc đường viền theo biểu thức màu
                    'line-width': 0.8                  // Độ dày của nét vẽ đường viền (0.8 pixel)
                },
                'filter': ['!=', '$type', 'Point']     // Bộ lọc: loại bỏ các đối tượng dạng điểm đơn lẻ
            });

            // 3. Thêm lớp tô màu nền đặc biệt dùng để làm nổi bật (highlight) khi người dùng chọn thửa đất cụ thể
            map.addLayer({
                'id': 'sheet-thua-dat-highlight-fill', // Tên lớp tô màu nền highlight khi click chọn
                'type': 'fill',                        // Kiểu hiển thị dạng vùng tô màu
                'source': 'sheet-thua-dat-src',        // Nguồn dữ liệu liên kết
                'paint': {
                    'fill-color': '#e32727',           // Màu đỏ nổi bật rõ nét khi thửa đất được chọn
                    'fill-opacity': 0.65               // Độ đậm rõ hơn một chút so với nền thường (65%)
                },
                'filter': ['==', ['get', 'ID Thửa Đất'], ''] // Bộ lọc ban đầu để trống ID nên sẽ không highlight thửa nào cả
            });

            // 4. Thêm lớp đường viền làm nổi bật khi người dùng chọn thửa đất cụ thể
            map.addLayer({
                'id': 'sheet-thua-dat-highlight-line', // Tên lớp viền highlight khi click chọn
                'type': 'line',                        // Kiểu hiển thị dạng đường kẻ
                'source': 'sheet-thua-dat-src',        // Nguồn dữ liệu liên kết
                'paint': {
                    'line-color': '#00ffff',           // Màu viền nổi bật tương phản (màu xanh dương sáng / cyan)
                    'line-width': 1.8                  // Định dạng viền dày dặn hơn để dễ nhìn (1.8 pixel)
                },
                'filter': ['==', ['get', 'ID Thửa Đất'], ''] // Bộ lọc ban đầu để trống ID
            });
        }
        
        // Sau khi tải dữ liệu xong, kiểm tra xem giao diện có đang chọn sẵn Phường/Xã nào ở ô lọc danh sách không
        const phuongSelect = document.getElementById('phuongFilter');
        if (phuongSelect && phuongSelect.value) {
            const selectedPhuong = phuongSelect.value;
            // Tạo biểu thức lọc chỉ hiển thị các thửa đất thuộc đúng Phường/Xã đang được chọn
            const sheetFilterExpr = ['==', ['get', 'Địa Chỉ Thửa Đất'], selectedPhuong];
            map.setFilter('sheet-thua-dat-fill', sheetFilterExpr);
            map.setFilter('sheet-thua-dat-line', sheetFilterExpr);
        }

    } catch (error) {
        // Bắt lỗi và in chi tiết ra cửa sổ Console nếu quá trình tải dữ liệu gặp sự cố mạng hoặc định dạng
        console.error("Lỗi khi tải dữ liệu thửa đất:", error);
    }
}

// --- HÀM ẨN TOÀN BỘ CÁC LỚP THỬA ĐẤT KHI CẦN THIẾT ---
function hideThuaDat(map) {
    // Tạo điều kiện lọc giả định tìm các đối tượng kiểu 'Point' không tồn tại, khiến các layer bị ẩn trống hoàn toàn
    const emptyFilter = ['==', '$type', 'Point'];
    
    // Kiểm tra từng lớp bản đồ liên quan nếu tồn tại thì áp dụng bộ lọc ẩn ngay lập tức
    if (map.getLayer('thua-dat-layer')) map.setFilter('thua-dat-layer', emptyFilter);
    if (map.getLayer('thua-dat-line-layer')) map.setFilter('thua-dat-line-layer', emptyFilter);
    if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', emptyFilter);
    if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', emptyFilter);
}

// --- HÀM ĐỒNG BỘ DỮ LIỆU CẬP NHẬT THỰC ĐỊA VỀ GOOGLE SHEETS / APPS SCRIPT ---
async function syncDataToSheet() {
    // 1. Kiểm tra xem người dùng đã chọn thửa đất nào trên bản đồ chưa (dựa vào biến toàn cục lưu ID đang chọn)
    if (!window.selectedThuaDatId) {
        alert("Vui lòng chọn một thửa đất trên bản đồ trước khi cập nhật!");
        return;
    }

    // 2. Lấy giá trị nội dung ghi chú do người dùng nhập từ ô textarea
    const noteInput = document.getElementById('txtFieldNote');
    const noteValue = noteInput ? noteInput.value.trim() : "";

    // 3. Lấy file ảnh thực tế từ thẻ input chọn tệp / chụp ảnh
    const camInput = document.getElementById('camInput');
    const file = camInput && camInput.files.length > 0 ? camInput.files[0] : null;

    // Hàm phụ trợ dùng để chuyển đổi định dạng tệp ảnh sang chuỗi mã hóa Base64 để gửi qua JSON an toàn
    const convertFileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    try {
        let base64Image = "";
        let fileName = "";
        
        // Nếu người dùng có chọn hoặc chụp ảnh, tiến hành chuyển đổi sang Base64
        if (file) {
            base64Image = await convertFileToBase64(file);
            fileName = file.name;
        }

        // Tạo gói dữ liệu (payload) hoàn chỉnh chuẩn bị gửi lên hệ thống lưu trữ
        const payload = {
            idThuaDat: window.selectedThuaDatId,
            ghiChu: noteValue,
            imageBaseline: base64Image,
            fileName: fileName,
            timestamp: new Date().toISOString()
        };

        // Kiểm tra xem cấu hình đường dẫn Web App của Google Apps Script đã được khai báo chưa
        if (!CONFIG.APPS_SCRIPT_URL) {
            alert("Chưa cấu hình APPS_SCRIPT_URL trong tệp cấu hình hệ thống!");
            return;
        }

        // In log thông báo tiến trình gửi dữ liệu lên bảng điều khiển console
        console.log("Đang gửi dữ liệu cập nhật thực địa lên Google Sheets...", payload);

        // Gửi yêu cầu HTTP POST tới Google Apps Script Web App
        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Sử dụng chế độ no-cors để tránh lỗi chặn chính sách chia sẻ tài nguyên nguồn gốc (CORS) của Google
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        // Hiển thị thông báo hoàn tất quá trình gửi dữ liệu thành công
        alert("Đã gửi dữ liệu cập nhật thực địa thành công!");
        
        // Sau khi gửi thành công thì tiến hành làm sạch (reset) lại các ô nhập liệu trên giao diện
        if (noteInput) noteInput.value = "";
        if (camInput) camInput.value = "";

    } catch (error) {
        // Bắt và xử lý lỗi phát sinh trong quá trình truyền tải dữ liệu về Sheet
        console.error("Lỗi khi đồng bộ dữ liệu về Google Sheet:", error);
        alert("Có lỗi xảy ra trong quá trình gửi dữ liệu, vui lòng kiểm tra lại kết nối!");
    }
}
