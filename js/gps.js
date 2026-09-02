// ==========================================
// gps.js - HỆ THỐNG HIỂN THỊ TỌA ĐỘ THEO CHUỘT VÀ GHIM ĐIỂM (MAPLIBRE GL)
// ==========================================

/**
 * Hàm khởi tạo toàn bộ tính năng GPS, tọa độ chuột và nút Ghim điểm trên bản đồ MapLibre.
 * @param {maplibregl.Map} map - Đối tượng bản đồ chính của ứng dụng.
 */
function initGPSControl(map) {
    
    // ----------------------------------------------------
    // PHẦN 1: TẠO HỘP CÔNG CỤ HIỂN THỊ TỌA ĐỘ ĐI THEO CON TRỎ CHUỘT (TOOLTIP)
    // ----------------------------------------------------
    
    // Tạo một thẻ phần tử `div` động trong DOM để chứa nội dung tọa độ hiển thị theo chuột
    const coordTooltip = document.createElement('div');
    coordTooltip.id = 'mouse-coord-tooltip'; // Gán ID để dễ quản lý hoặc định nghĩa thêm trong CSS nếu cần
    
    // Định nghĩa các biến chứa thông số cấu hình giao diện cho tooltip tọa độ
    const tooltipPosition = 'absolute';                         // Đặt vị trí tuyệt đối để linh hoạt trôi nổi theo tọa độ màn hình của chuột
    const tooltipBg = 'rgba(0, 0, 0, 0.75);';                   // Màu nền: Màu đen có độ trong suốt 75% tạo hiệu ứng tối giản
    const tooltipColor = '#ffffff';                             // Màu chữ: Màu trắng sáng giúp nổi bật trên nền tối
    const tooltipPaddingTopBot = '4px';                         // Khoảng đệm bên trong theo chiều dọc (trên/dưới)
    const tooltipPaddingLeftRight = '8px';                      // Khoảng đệm bên trong theo chiều ngang (trái/phải)
    const tooltipFontSize = '12px';                             // Cỡ chữ hiển thị: 12 pixel (nhỏ gọn, rõ ràng)
    const tooltipFontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"; // Bộ font chữ hệ thống hiện đại, tối ưu cho mọi OS
    const tooltipBorderRadius = '4px';                          // Bo tròn 4 góc của hộp tooltip với bán kính 4 pixel
    const tooltipPointerEvents = 'none';                        // QUAN TRỌNG: Vô hiệu hóa mọi sự kiện chuột trên tooltip (giúp chuột không bị vướng/cản trở khi rê qua)
    const tooltipDisplay = 'none';                              // Trạng thái ban đầu: Ẩn đi (chỉ hiện khi chuột di chuyển vào trong bản đồ)
    const tooltipZIndex = '1000';                               // Mức hiển thị ưu tiên lớp (z-index): Đặt cao (1000) để luôn đè lên trên các lớp khác của bản đồ
    const tooltipWhiteSpace = 'nowrap';                         // Ép nội dung tọa độ hiển thị trên một dòng duy nhất, không bị xuống dòng

    // Gom nhóm và gán chuỗi định dạng CSS hoàn chỉnh vào thuộc tính style của tooltip
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
    
    // Đưa thẻ tooltip vừa tạo vào bên trong khung chứa chính của bản đồ (Map Container)
    map.getContainer().appendChild(coordTooltip);

    // ----------------------------------------------------
    // PHẦN 2: LẮNG NGHE SỰ KIỆN DI CHUYỂN CHUỘT TRÊN BẢN ĐỒ (MOUSEMOVE)
    // ----------------------------------------------------
    map.on('mousemove', function (e) {
        // Lấy tọa độ Kinh độ (Lng) và Vĩ độ (Lat) tại vị trí con trỏ chuột, làm tròn chính xác đến 6 chữ số thập phân
        const lng = e.lngLat.lng.toFixed(6);
        const lat = e.lngLat.lat.toFixed(6);

        // Cập nhật nội dung văn bản bên trong tooltip theo chuẩn "Lat: [vĩ độ], Lng: [kinh độ]"
        coordTooltip.innerHTML = `${lat}, ${lng}`;
        coordTooltip.style.display = 'block'; // Hiển thị tooltip lên màn hình khi chuột đang ở trong bản đồ

        // Lấy tọa độ pixel trên màn hình (tính theo trục X và Y) của con trỏ chuột
        const point = e.point;
        // Dịch chuyển vị trí tooltip cách mũi tên chuột một khoảng +15px theo cả 2 trục để tránh bị con trỏ chuột che khuất
        coordTooltip.style.left = (point.x + 15) + 'px';
        coordTooltip.style.top = (point.y + 15) + 'px';
    });

    // ----------------------------------------------------
    // PHẦN 3: LẮNG NGHE SỰ KIỆN KHI CHUỘT RỜI KHỎI KHUNG BẢN ĐỒ (MOUSEOUT)
    // ----------------------------------------------------
    map.on('mouseout', function () {
        // Ẩn hộp tooltip tọa độ ngay lập tức khi con trỏ chuột rê ra ngoài biên giới hạn của khung bản đồ
        coordTooltip.style.display = 'none';
    });

    // ----------------------------------------------------
    // PHẦN 4: TẠO NÚT BẤM "GHIM ĐIỂM" ĐỒNG BỘ TRONG CỤM ĐIỀU KHIỂN BẢN ĐỒ
    // ----------------------------------------------------
    let isPinModeActive = false; // Biến cờ (flag) kiểm tra trạng thái: true = đang bật chế độ ghim điểm, false = tắt

    // Định nghĩa lớp điều khiển tùy chỉnh (Custom Control) tuân theo cấu trúc chuẩn của MapLibre GL JS
    class PinControl {
        // Phương thức chạy khi nút được thêm vào bản đồ
        onAdd(mapInstance) {
            this._map = mapInstance;
            this._container = document.createElement('div');
            this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group'; // Gán class chuẩn của MapLibre để đồng bộ kiểu dáng nhóm nút điều khiển
            
            // Tạo phần tử thẻ <button> đại diện cho nút ghim điểm
            const pinButton = document.createElement('button');
            pinButton.type = 'button';
            pinButton.title = 'Bật/Tắt chế độ ghim địa điểm'; // Chú thích gợi ý khi rê chuột vào nút
            pinButton.innerHTML = '📍';                      // Biểu tượng icon chiếc ghim bản đồ
            
            // Khai báo các thông số giao diện chi tiết cho nút bấm
            const ctrlBtnWidth = '29px';                    // Chiều rộng chuẩn của nút điều khiển bản đồ MapLibre
            const ctrlBtnHeight = '29px';                   // Chiều cao chuẩn của nút điều khiển bản đồ MapLibre
            const ctrlBtnDisplay = 'flex';                  // Sử dụng mô hình Flexbox để canh chỉnh nội dung bên trong
            const ctrlBtnAlign = 'center';                  // Canh giữa theo chiều dọc
            const ctrlBtnJustify = 'center';                // Canh giữa theo chiều ngang
            const ctrlBtnFontSize = '15px';                 // Cỡ chữ của icon 📍
            const ctrlBtnBorder = 'none';                   // Không viền mặc định
            const ctrlBtnBg = '#ffffff';                    // Màu nền mặc định: Trắng sáng
            const ctrlBtnCursor = 'pointer';                // Con trỏ chuột chuyển thành dạng bàn tay khi rê vào
            const ctrlBtnOutline = 'none';                  // Loại bỏ đường viền sáng (outline) khi bấm vào nút

            // Áp dụng chuỗi thông số CSS vào nút bấm
            pinButton.style.cssText = `
                width: ${ctrlBtnWidth};
                height: ${ctrlBtnHeight};
                display: ${ctrlBtnDisplay};
                align-items: ${ctrlBtnAlign};
                justify-content: ${ctrlBtnJustify};
                font-size: ${ctrlBtnFontSize};
                border: ${ctrlBtnBorder};
                background: ${ctrlBtnBg};
                cursor: ${ctrlBtnCursor};
                outline: ${ctrlBtnOutline};
            `;
            
            // Sự kiện khi người dùng click vào nút ghim điểm
            pinButton.onclick = () => {
                isPinModeActive = !isPinModeActive; // Đảo trạng thái bật/tắt của chế độ ghim
                
                if (isPinModeActive) {
                    // TRƯỜNG HỢP BẬT CHẾ ĐỘ GHIM:
                    pinButton.style.background = '#e8f0fe';         // Đổi màu nền nút sang màu xanh dương nhạt báo hiệu đang kích hoạt
                    mapInstance.getContainer().style.cursor = 'crosshair'; // Đổi hình dạng con trỏ chuột thành hình dấu cộng (+) đặc trưng chọn điểm
                } else {
                    // TRƯỜNG HỢP TẮT CHẾ ĐỘ GHIM:
                    pinButton.style.background = '#ffffff';         // Trả lại màu nền trắng ban đầu cho nút
                    mapInstance.getContainer().style.cursor = '';   // Khôi phục con trỏ chuột về mặc định
                    
                    // Nếu đang có điểm ghim tạm thời trên bản đồ thì tiến hành xóa bỏ
                    if (tempMarker) {
                        tempMarker.remove();
                        tempMarker = null;
                    }
                }
            };
            
            this._container.appendChild(pinButton);
            return this._container;
        }

        // Phương thức dọn dẹp khi nút bị xóa khỏi bản đồ
        onRemove() {
            this._container.parentNode.removeChild(this._container);
            this._map = undefined;
        }
    }

    // Đưa điều khiển PinControl tích hợp vào góc trên bên phải ('top-right') của bản đồ
    map.addControl(new PinControl(), 'top-right');

    let tempMarker = null; // Biến lưu trữ đối tượng Marker (ghim tạm thời) hiện tại trên bản đồ

    // ----------------------------------------------------
    // PHẦN 5: LẮNG NGHE SỰ KIỆN CLICK TRÊN BẢN ĐỒ ĐỂ TẠO ĐIỂM GHIM
    // ----------------------------------------------------
    map.on('click', function (e) {
        // Kiểm tra điều kiện: Nếu chế độ ghim chưa được bật HOẶC đang trong chế độ đo đạc (isMeasuring) thì dừng lại, không làm gì cả
        if (!isPinModeActive) return;
        if (typeof isMeasuring !== 'undefined' && isMeasuring) return;

        // Nếu đã tồn tại một điểm ghim tạm trước đó, tiến hành xóa sạch ngay lập tức để giải phóng bộ nhớ
        if (tempMarker) {
            tempMarker.remove();
            tempMarker = null;
        }

        // Lấy tọa độ Kinh/Vĩ độ tại vị trí người dùng vừa click chuột lên bản đồ (làm tròn 6 chữ số thập phân)
        const clickedLng = e.lngLat.lng.toFixed(6);
        const clickedLat = e.lngLat.lat.toFixed(6);

        // Tạo phần tử HTML chứa giao diện bên trong bảng thông tin nổi (Popup) khi ghim điểm
        const popupContent = document.createElement('div');
        
        // Khai báo các thông số kích thước và font chữ cho khung Popup
        const popupWidth = '150px';                             // Chiều rộng cố định của khung popup: 150 pixel
        const popupPadding = '0px';                             // Khoảng đệm bên trong khung popup
        const popupMargin = '0px';                              // Khoảng cách bên ngoài khung popup
        const popupFont = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"; // Font chữ hiện đại

        popupContent.style.cssText = `
            font-family: ${popupFont};
            width: ${popupWidth};
            padding: ${popupPadding};
            margin: ${popupMargin};
        `;
        
        // Khai báo các thông số cho ô nhập tên địa điểm (Input)
        const inputWidth = '100%';                              // Chiều rộng phủ kín 100% khung chứa popup
        const inputPaddingTopBot = '3px';                       // Đệm trên/dưới ô nhập liệu: 3px
        const inputPaddingLeftRight = '5px';                    // Đệm trái/phải ô nhập liệu: 5px
        const inputFontSize = '13px';                           // Cỡ chữ trong ô nhập: 13px
        const inputBorder = '1px solid #ccc';                   // Viền xám nhạt xung quanh ô nhập
        const inputRadius = '3px';                              // Bo tròn góc ô nhập: 3px
        const inputMarginBot = '3px';                           // Khoảng cách lề dưới ô nhập: 3px

        // Khai báo thông số hiển thị dòng tọa độ phụ bên dưới ô nhập
        const coordFontSize = '12px';                           // Cỡ chữ tọa độ: 12px
        const coordColor = '#555';                              // Màu chữ: Xám đậm trung tính
        const coordMarginBot = '4px';                           // Khoảng cách lề dưới tọa độ: 4px
        const coordFontFamily = 'monospace';                    // Sử dụng font chữ dạng đơn không đổi chiều (monospace) giúp các con số thẳng hàng đẹp mắt

        // Khai báo thông số cho nút bấm hành động ("Đánh dấu" / "Bỏ đánh dấu")
        const btnWidth = '100%';                                // Chiều rộng nút: phủ kín 100%
        const btnPaddingTopBot = '3px';                         // Đệm trên/dưới nút: 3px
        const btnPaddingLeftRight = '6px';                      // Đệm trái/phải nút: 6px
        const btnBgColor = '#1a73e8';                           // Màu nền nút: Xanh dương chủ đạo (Google Blue)
        const btnTextColor = '#fff';                            // Màu chữ trên nút: Trắng
        const btnBorder = 'none';                               // Không viền
        const btnRadius = '3px';                                // Bo tròn góc nút: 3px
        const btnFontWeight = '500';                            // Độ dày chữ: Medium (500)
        const btnFontSize = '11px';                             // Cỡ chữ trên nút: 11px

        // Ghép nối cấu trúc HTML hoàn chỉnh bên trong Popup gồm: Ô nhập tên, dòng tọa độ chi tiết và nút bấm xác nhận
        popupContent.innerHTML = `
            <input type="text" id="place-name-input" placeholder="Tên địa điểm..." value="Địa điểm mới" style="
                width: ${inputWidth}; 
                padding: ${inputPaddingTopBot} ${inputPaddingLeftRight}; 
                font-size: ${inputFontSize}; 
                border: ${inputBorder}; 
                border-radius: ${inputRadius}; 
                box-sizing: border-box; 
                margin-bottom: ${inputMarginBot}; 
                outline: none;
            " />
            
            <div style="
                font-size: ${coordFontSize}; 
                color: ${coordColor}; 
                margin-bottom: ${coordMarginBot}; 
                font-family: ${coordFontFamily};
            ">
                ${clickedLat}, ${clickedLng}
            </div>
            
            <button id="pin-action-btn" style="
                width: ${btnWidth}; 
                padding: ${btnPaddingTopBot} ${btnPaddingLeftRight}; 
                background: ${btnBgColor}; 
                color: ${btnTextColor}; 
                border: ${btnBorder}; 
                border-radius: ${btnRadius}; 
                cursor: pointer; 
                font-weight: ${btnFontWeight}; 
                font-size: ${btnFontSize};
            ">
                Đánh dấu
            </button>
        `;

        const popupOffset = 15;         // Khoảng cách khoảng trống (offset) giữa đỉnh mũi tên ghim và khung popup hiển thị
        const popupCloseButton = true;  // Cho phép hiển thị nút đóng dạng dấu nhân (X) ở góc popup

        // Khởi tạo đối tượng Popup của MapLibre với các cấu hình trên
        const popup = new maplibregl.Popup({ 
            offset: popupOffset, 
            closeButton: popupCloseButton 
        }).setDOMContent(popupContent);

        const markerColor = '#ea4335';  // Màu sắc của biểu tượng ghim định vị (Mã màu đỏ đặc trưng Google Marker)

        // Khởi tạo đối tượng Marker (ghim vị trí) trên bản đồ tại tọa độ người dùng click, gắn kèm popup vừa tạo
        tempMarker = new maplibregl.Marker({ color: markerColor })
            .setLngLat([e.lngLat.lng, e.lngLat.lat])
            .setPopup(popup)
            .addTo(map);

        // Lấy tham chiếu đến các phần tử nút bấm và ô input vừa được tạo ra trong DOM của popup
        const actionBtn = popupContent.querySelector('#pin-action-btn');
        const nameInput = popupContent.querySelector('#place-name-input');

        let isClearedDefaultName = false;
        // Sự kiện khi người dùng nhấn vào ô nhập tên địa điểm
        nameInput.onfocus = function() {
            // Nếu chưa xóa lần nào và giá trị đang là chữ mặc định "Địa điểm mới", tự động xóa trắng để người dùng gõ tên mới thuận tiện
            if (!isClearedDefaultName && nameInput.value === "Địa điểm mới") {
                nameInput.value = "";
                isClearedDefaultName = true;
            }
        };

        // Xử lý sự kiện khi người dùng bấm vào nút "Đánh dấu"
        actionBtn.onclick = function (event) {
            const savedMarker = tempMarker;
            tempMarker = null;    // Tách biến tạm ra để điểm ghim này chính thức được cố định lại trên bản đồ, không bị xóa tự động nữa

            actionBtn.innerText = "Bỏ đánh dấu";                    // Đổi nhãn nút thành "Bỏ đánh dấu"
            actionBtn.style.background = "#d93025";                 // Đổi màu nền nút sang màu đỏ cảnh báo
            nameInput.disabled = true;                              // Khóa ô nhập tên lại, không cho chỉnh sửa nữa
            nameInput.style.background = "#f1f3f4";                 // Đổi màu nền ô input sang màu xám nhạt biểu thị trạng thái bị khóa

            // Khi người dùng bấm tiếp vào nút "Bỏ đánh dấu" lần nữa, tiến hành xóa hẳn điểm ghim này khỏi bản đồ
            actionBtn.onclick = function () {
                savedMarker.remove();
            };

            event.stopPropagation(); // Ngăn sự kiện click lan truyền ra các lớp bên dưới bản đồ
        };

        tempMarker.togglePopup(); // Tự động bật mở khung popup ngay khi vừa ghim điểm xuống bản đồ
    });
}
