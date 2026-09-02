// ==========================================
// gps.js - HỆ THỐNG HIỂN THỊ TỌA ĐỘ THEO CHUỘT (MAPLIBRE GL)
// ==========================================

/**
 * Hàm khởi tạo toàn bộ tính năng hiển thị tọa độ theo con trỏ chuột trên bản đồ MapLibre.
 * @param {maplibregl.Map} map - Đối tượng bản đồ chính của ứng dụng.
 */
function initGPSControl(map) {
    
    // ====================================================
    // PHẦN 1: TẠO HỘP CÔNG CỤ (TOOLTIP) HIỂN THỊ TỌA ĐỘ ĐI THEO CON TRỎ CHUỘT
    // ====================================================
    
    // Tạo thẻ div chứa nội dung hiển thị tọa độ
    const coordTooltip = document.createElement('div');
    coordTooltip.id = 'mouse-coord-tooltip'; // Đặt ID để đồng bộ với bộ khung CSS tùy chỉnh
    
    // Các thông số cấu hình giao diện cho Tooltip hiển thị tọa độ
    const tooltipPosition = 'absolute';             // Định vị tuyệt đối trên khung chứa bản đồ
    const tooltipBg = 'rgba(0, 0, 0, 0.75);';       // Màu nền đen mờ (độ trong suốt 75%)
    const tooltipColor = '#ffffff';                 // Màu chữ trắng
    const tooltipPaddingTopBot = '4px';             // Khoảng cách đệm trên/dưới của hộp chữ
    const tooltipPaddingLeftRight = '8px';          // Khoảng cách đệm trái/phải của hộp chữ
    const tooltipFontSize = '12px';                 // Cỡ chữ hiển thị tọa độ
    const tooltipFontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"; // Phông chữ tiêu chuẩn, hiện đại
    const tooltipBorderRadius = '4px';              // Độ bo tròn các góc của hộp chữ
    const tooltipPointerEvents = 'none';            // Vô hiệu hóa tương tác chuột qua hộp này (tránh cản trở click bản đồ)
    const tooltipDisplay = 'none';                  // Mặc định ẩn đi khi chuột chưa vào bản đồ
    const tooltipZIndex = '100';                    // Đảm bảo hiển thị nổi lên trên cùng của bản đồ
    const tooltipWhiteSpace = 'nowrap';             // Không cho phép chữ bị xuống dòng

    // Áp dụng các thông số kiểu dáng (CSS) vừa khai báo vào thẻ div Tooltip
    coordTooltip.style.cssText = `
        position: ${tooltipPosition};
        background: ${tooltipBg};
        color: ${tooltipColor};
        padding: ${tooltipPaddingTopBot} ${tooltipPaddingLeftRight};
        font-size: ${tooltipFontSize};
        font-family: ${tooltipFontFamily};
        border-radius: ${tooltipBorderRadius};
        pointer-events: ${tooltipPointerEvents};
        display: ${tooltipDisplay};
        z-index: ${tooltipZIndex};
        white-space: ${tooltipWhiteSpace};
    `;
    
    // Đưa thẻ Tooltip này vào bên trong khung chứa bản đồ (Map Container)
    map.getContainer().appendChild(coordTooltip);

    // ====================================================
    // PHẦN 2: LẮNG NGHE SỰ KIỆN DI CHUYỂN CHUỘT TRÊN BẢN ĐỒ (MOUSEMOVE)
    // ====================================================
    map.on('mousemove', function (e) {
        // Lấy tọa độ Kinh độ (lng) và Vĩ độ (lat), làm tròn đến 6 chữ số thập phân cho gọn
        const lng = e.lngLat.lng.toFixed(6);
        const lat = e.lngLat.lat.toFixed(6);

        // Cập nhật nội dung hiển thị bên trong hộp Tooltip theo vị trí con trỏ hiện tại
        coordTooltip.innerHTML = `Lat: ${lat}, Lng: ${lng}`;
        coordTooltip.style.display = 'block'; // Hiển thị hộp tọa độ lên

        // Lấy tọa độ điểm ảnh (pixel) trên màn hình để dịch chuyển Tooltip đi theo con trỏ chuột
        const point = e.point;
        coordTooltip.style.left = (point.x + 15) + 'px'; // Đặt cách con trỏ sang phải 15px
        coordTooltip.style.top = (point.y + 15) + 'px';  // Đặt cách con trỏ xuống dưới 15px
    });

    // ====================================================
    // PHẦN 3: LẮNG NGHE SỰ KIỆN KHI CHUỘT RỜI KHỎI KHUNG BẢN ĐỒ (MOUSEOUT)
    // ====================================================
    map.on('mouseout', function () {
        coordTooltip.style.display = 'none'; // Ẩn hộp tọa độ đi khi chuột ra ngoài vùng bản đồ
    });
}
