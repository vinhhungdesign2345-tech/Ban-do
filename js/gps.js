// ==========================================
// gps.js - HỆ THỐNG HIỂN THỊ TỌA ĐỘ THEO CHUỘT VÀ GHIM ĐIỂM (MAPLIBRE GL)
// ==========================================

/**
 * Hàm khởi tạo toàn bộ tính năng GPS, tọa độ chuột và ghim địa điểm trên bản đồ MapLibre.
 * @param {maplibregl.Map} map - Đối tượng bản đồ chính của ứng dụng.
 */
function initGPSControl(map) {
    
    // ----------------------------------------------------
    // PHẦN 1: TẠO HỘP CÔNG CỤ HIỂN THỊ TỌA ĐỘ ĐI THEO CON TRỎ CHUỘT
    // ----------------------------------------------------
    
    // Tạo thẻ <div> động trong bộ nhớ dùng làm tooltip hiển thị tọa độ bay theo chuột
    const coordTooltip = document.createElement('div');
    coordTooltip.id = 'mouse-coord-tooltip'; // Đặt ID để định danh
    
    // Thiết lập phong cách hiển thị (CSS) trực tiếp bằng JavaScript cho tooltip
    coordTooltip.style.cssText = `
        position: absolute;                     /* Định vị tuyệt đối để có thể tự do thay đổi tọa độ pixel trên màn hình */
        background: rgba(0, 0, 0, 0.75);        /* Màu nền đen mờ đục 75% giúp nổi bật chữ nhưng không che khuất bản đồ */
        color: #ffffff;                         /* Màu chữ trắng sáng */
        padding: 4px 8px;                       /* Khoảng cách đệm bên trong: trên/dưới 4px, trái/phải 8px */
        font-size: 12px;                        /* Kích thước chữ nhỏ gọn, tinh tế */
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; /* Phông chữ chuẩn hệ thống hiện đại */
        border-radius: 4px;                     /* Bo tròn 4 góc khung với bán kính 4px */
        pointer-events: none;                   /* Quan trọng: Vô hiệu hóa mọi sự kiện chuột trên tooltip để tránh cản trở việc click bản đồ bên dưới */
        display: none;                          /* Mặc định ẩn đi, chỉ hiện khi chuột di chuyển vào bản đồ */
        z-index: 1000;                          /* Đảm bảo khung luôn nổi lên trên cùng của các lớp bản đồ */
        white-space: nowrap;                    /* Buộc văn bản nằm trên một dòng duy nhất, không bị xuống dòng ngắt quãng */
    `;
    
    // Lấy phần tử chứa khung nhìn bản đồ và gắn tooltip này vào bên trong
    map.getContainer().appendChild(coordTooltip);

    // ----------------------------------------------------
    // PHẦN 2: LẮNG NGHE SỰ KIỆN DI CHUYỂN CHUỘT TRÊN BẢN ĐỒ (MOUSEMOVE)
    // ----------------------------------------------------
    map.on('mousemove', function (e) {
        // e.lngLat chứa tọa độ kinh độ (lng) và vĩ độ (lat) thực tế theo hệ thống bản đồ
        // .toFixed(6) giới hạn hiển thị chính xác đến 6 chữ số thập phân
        const lng = e.lngLat.lng.toFixed(6);
        const lat = e.lngLat.lat.toFixed(6);

        // Cập nhật nội dung dạng: Lat: [vĩ độ], Lng: [kinh độ] vào tooltip
        coordTooltip.innerHTML = `Lat: ${lat}, Lng: ${lng}`;
        coordTooltip.style.display = 'block'; // Hiển thị tooltip lên màn hình khi chuột đang di chuyển trong bản đồ

        // e.point chứa tọa độ điểm ảnh (pixel x, y) tính từ góc trên bên trái của khung chứa bản đồ
        const point = e.point;
        
        // Đặt vị trí hiển thị của tooltip dịch chuyển lệch xuống dưới và sang phải con trỏ chuột một khoảng 15px 
        // để con trỏ chuột không che mất chữ hiển thị tọa độ
        coordTooltip.style.left = (point.x + 15) + 'px';
        coordTooltip.style.top = (point.y + 15) + 'px';
    });

    // ----------------------------------------------------
    // PHẦN 3: LẮNG NGHE SỰ KIỆN KHI CHUỘT RỜI KHỎI KHUNG BẢN ĐỒ (MOUSEOUT)
    // ----------------------------------------------------
    map.on('mouseout', function () {
        // Ẩn hộp tọa độ đi khi con trỏ chuột rê ra ngoài biên giới hạn của khung bản đồ
        coordTooltip.style.display = 'none';
    });

    // ----------------------------------------------------
    // PHẦN 4: LẮNG NGHE SỰ KIỆN CLICK TRÊN BẢN ĐỒ ĐỂ GHIM ĐIỂM
    // ----------------------------------------------------
    map.on('click', function (e) {
        // Kiểm tra an toàn: Nếu ứng dụng đang bật chế độ đo đạc (measure) thì bỏ qua sự kiện ghim điểm này
        if (typeof isMeasuring !== 'undefined' && isMeasuring) return;

        // Lấy tọa độ kinh/vĩ độ tại vị trí click và rút gọn còn 6 số thập phân
        const clickedLng = e.lngLat.lng.toFixed(6);
        const clickedLat = e.lngLat.lat.toFixed(6);

        // Tạo phần tử HTML chứa giao diện bên trong bảng Popup khi ghim điểm
        const popupContent = document.createElement('div');
        popupContent.style.cssText = "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 200px; padding: 2px;";
        
        // Đổ mã cấu trúc HTML chi tiết cho popup: Ô nhập tên địa điểm, dòng tọa độ thu gọn, và nút bấm hành động
        popupContent.innerHTML = `
            <input type="text" id="place-name-input" placeholder="Nhập tên địa điểm..." value="Địa điểm mới" style="width: 100%; padding: 6px; font-size: 13px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; margin-bottom: 6px;" />
            <div style="font-size: 12px; color: #5f6368; margin-bottom: 8px; font-family: monospace;">${clickedLat}, ${clickedLng}</div>
            <button id="pin-action-btn" style="width: 100%; padding: 6px 12px; background: #1a73e8; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; font-size: 12px;">Đánh dấu</button>
        `;

        // Khởi tạo đối tượng Popup của MapLibre với độ lệch (offset) 25 pixel phía trên đầu biểu tượng ghim
        const popup = new maplibregl.Popup({ offset: 25 }).setDOMContent(popupContent);

        // Khởi tạo một đối tượng Marker (Ghim bản đồ) màu đỏ (#ea4335) tại chính xác tọa độ click, gắn popup và thêm vào bản đồ
        const marker = new maplibregl.Marker({ color: '#ea4335' })
            .setLngLat([e.lngLat.lng, e.lngLat.lat])
            .setPopup(popup)
            .addTo(map);

        // Biến cục bộ theo dõi trạng thái ghim: 
        // - false: Điểm mới tạo, chưa lưu (nút hiển thị "Đánh dấu")
        // - true: Điểm đã được lưu giữ trên bản đồ (nút đổi thành "Bỏ đánh dấu")
        let isMarked = false;

        // Truy xuất đến phần tử nút bấm và ô nhập liệu bên trong popup vừa khởi tạo
        const actionBtn = popupContent.querySelector('#pin-action-btn');
        const nameInput = popupContent.querySelector('#place-name-input');

        // Lắng nghe sự kiện click vào nút hành động trong popup
        actionBtn.onclick = function () {
            if (!isMarked) {
                // TRƯỜNG HỢP 1: Bấm "Đánh dấu" lần đầu tiên để lưu điểm ghim lại
                isMarked = true;                                // Chuyển trạng thái thành đã đánh dấu
                actionBtn.innerText = "Bỏ đánh dấu";              // Đổi chữ trên nút thành "Bỏ đánh dấu"
                actionBtn.style.background = "#ea4335";         // Đổi màu nền nút sang màu đỏ cảnh báo
                nameInput.disabled = true;                      // Khóa ô nhập tên lại để cố định thông tin địa điểm
                popup.setOptions({ closeOnClick: false });      // Cấu hình để popup không bị tự động ẩn đi khi người dùng click ra vùng trống ngoài bản đồ
            } else {
                // TRƯỜNG HỢP 2: Bấm "Bỏ đánh dấu" (khi nhấp vào ghim cũ đã lưu) -> Xóa bỏ hoàn toàn marker khỏi bản đồ
                marker.remove();
            }
        };

        // Tự động kích hoạt bật mở popup lên ngay lập tức sau khi tạo xong marker
        marker.togglePopup();
    });
}
