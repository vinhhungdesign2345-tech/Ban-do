// ==========================================
// gps.js - HỆ THỐNG HIỂN THỊ TỌA ĐỘ THEO CHUỘT VÀ GHIM ĐIỂM (GIỐNG GOOGLE MAPS)
// ==========================================

/**
 * Hàm khởi tạo tính năng GPS cho bản đồ Leaflet
 * @param {L.Map} map - Đối tượng bản đồ Leaflet hiện tại của bạn
 */
function initGPSControl(map) {
    
    // ----------------------------------------------------
    // PHẦN 1: TẠO HỘP CÔNG CỤ HIỂN THỊ TỌA ĐỘ ĐI THEO CON TRỎ CHUỘT
    // ----------------------------------------------------
    
    // Tạo một phần tử thẻ <div> mới để làm bảng hiển thị tọa độ trôi nổi
    const coordTooltip = document.createElement('div');
    coordTooltip.id = 'mouse-coord-tooltip'; // Gán ID để nhận diện
    
    // Thiết lập toàn bộ định dạng kiểu dáng CSS trực tiếp cho tooltip
    coordTooltip.style.cssText = `
        position: absolute;                   /* Đặt định vị tuyệt đối để dễ dàng di chuyển theo tọa độ màn hình */
        background: rgba(0, 0, 0, 0.75);      /* Màu nền đen mờ đục 75% tạo độ tương phản dễ nhìn */
        color: #ffffff;                       /* Màu chữ trắng hiển thị nổi bật */
        padding: 4px 8px;                     /* Khoảng cách đệm bên trong hộp (trên/dưới 4px, trái/phải 8px) */
        font-size: 12px;                      /* Kích thước chữ nhỏ gọn, chuyên nghiệp */
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; /* Phông chữ chuẩn hệ thống */
        border-radius: 4px;                   /* Bo tròn nhẹ 4 góc của khung */
        pointer-events: none;                 /* Vô hiệu hóa tương tác chuột với tooltip (tránh cản trở sự kiện bản đồ bên dưới) */
        display: none;                        /* Ban đầu ẩn đi cho đến khi con trỏ chuột di chuyển vào bản đồ */
        z-index: 1000;                        /* Đảm bảo khung hiển thị luôn nằm trên các lớp dữ liệu khác của bản đồ */
        white-space: nowrap;                  /* Buộc nội dung hiển thị trên một dòng duy nhất, không xuống dòng */
    `;
    
    // Đưa khung tooltip vừa tạo vào bên trong phần tử chứa khung nhìn bản đồ của Leaflet
    map.getContainer().appendChild(coordTooltip);

    // ----------------------------------------------------
    // PHẦN 2: KHAI BÁO BIẾN LƯU TRỮ ĐIỂM GHIM TRÊN BẢN ĐỒ
    // ----------------------------------------------------
    let pinnedMarker = null; // Biến giữ tham chiếu đến đối tượng Marker đang được ghim (giúp dễ quản lý và xóa khi cần)

    // ----------------------------------------------------
    // PHẦN 3: LẮNG NGHE SỰ KIỆN DI CHUYỂN CHUỘT TRÊN BẢN ĐỒ (MOUSEMOVE)
    // ----------------------------------------------------
    map.on('mousemove', function (e) {
        // e.latlng chứa thông số vĩ độ (lat) và kinh độ (lng) thực tế tại vị trí con trỏ chuột
        const lat = e.latlng.lat.toFixed(6); // Làm tròn giá trị vĩ độ đến 6 chữ số thập phân để đạt độ chính xác cao
        const lng = e.latlng.lng.toFixed(6); // Làm tròn giá trị kinh độ đến 6 chữ số thập phân

        // Cập nhật nội dung văn bản hiển thị tọa độ bên trong tooltip
        coordTooltip.innerHTML = `Lat: ${lat}, Lng: ${lng}`;
        coordTooltip.style.display = 'block'; // Hiển thị tooltip lên màn hình

        // e.containerPoint chứa tọa độ điểm ảnh (pixel x, y) tính từ góc trên bên trái của khung bản đồ
        const containerPoint = e.containerPoint;
        
        // Đặt vị trí hiển thị của tooltip dịch chuyển lệch xuống dưới và sang phải con trỏ chuột một chút (15 pixel) để không bị che khuất
        coordTooltip.style.left = (containerPoint.x + 15) + 'px';
        coordTooltip.style.top = (containerPoint.y + 15) + 'px';
    });

    // ----------------------------------------------------
    // PHẦN 4: LẮNG NGHE SỰ KIỆN KHI CHUỘT RỜI KHỎI KHUNG BẢN ĐỒ (MOUSEOUT)
    // ----------------------------------------------------
    map.on('mouseout', function () {
        coordTooltip.style.display = 'none'; // Ẩn tooltip đi khi con trỏ chuột đi ra ngoài khu vực bản đồ
    });

    // ----------------------------------------------------
    // PHẦN 5: LẮNG NGHE SỰ KIỆN CLICK BỪA LÊN BẢN ĐỒ ĐỂ GHIM ĐIỂM (CLICK)
    // ----------------------------------------------------
    map.on('click', function (e) {
        // Lấy tọa độ tại chính xác điểm người dùng vừa bấm chuột
        const clickedLat = e.latlng.lat.toFixed(6);
        const clickedLng = e.latlng.lng.toFixed(6);

        // Kiểm tra xem trước đó đã có điểm nào được ghim chưa. Nếu có rồi, hãy xóa điểm cũ đi trước khi tạo điểm mới
        if (pinnedMarker) {
            map.removeLayer(pinnedMarker);
        }

        // Tạo một đối tượng Marker mới của Leaflet tại tọa độ vừa bấm và thêm vào bản đồ
        pinnedMarker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);

        // Xây dựng mã HTML cho khung Popup hiển thị thông tin tọa độ đã ghim kèm theo nút bấm "Bỏ ghim"
        const popupContent = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 160px; padding: 2px;">
                <b style="color: #1a73e8; font-size: 14px;">📍 Tọa độ đã ghim</b>
                <hr style="margin: 6px 0; border: none; border-top: 1px solid #dadce0;">
                <span style="font-size: 13px; color: #3c4043;"><b>Vĩ độ (Lat):</b> ${clickedLat}</span><br>
                <span style="font-size: 13px; color: #3c4043; margin-bottom: 8px; display: inline-block;"><b>Kinh độ (Lng):</b> ${clickedLng}</span>
                <button id="remove-pin-btn" style="width: 100%; padding: 6px 12px; background: #ea4335; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 12px;">Bỏ ghim</button>
            </div>
        `;

        // Ràng buộc nội dung popup vào marker vừa tạo và tự động mở bảng popup lên ngay lập tức
        pinnedMarker.bindPopup(popupContent).openPopup();

        // ----------------------------------------------------
        // PHẦN 6: XỬ LÝ SỰ KIỆN TƯƠNG TÁC CHO NÚT "BỎ GHIM" TRONG POPUP
        // ----------------------------------------------------
        // Lắng nghe sự kiện khi khung popup chính thức mở xong trên DOM
        pinnedMarker.on('popupopen', function () {
            const removeBtn = document.getElementById('remove-pin-btn'); // Tìm nút bỏ ghim thông qua ID
            if (removeBtn) {
                removeBtn.onclick = function () {
                    map.removeLayer(pinnedMarker); // Xóa bỏ hoàn toàn lớp biểu tượng ghim khỏi bản đồ
                    pinnedMarker = null;           // Đặt lại biến lưu trữ về trạng thái trống (null)
                };
            }
        });
    });
}
