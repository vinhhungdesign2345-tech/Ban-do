// ==========================================
// gps.js - HỆ THỐNG HIỂN THỊ TỌA ĐỘ THEO CHUỘT VÀ GHIM ĐIỂM (MAPLIBRE GL)
// ==========================================

/**
 * Hàm khởi tạo toàn bộ tính năng GPS, tọa độ chuột và nút Ghim điểm trên bản đồ MapLibre.
 * @param {maplibregl.Map} map - Đối tượng bản đồ chính của ứng dụng.
 */
function initGPSControl(map) {
    
    // ----------------------------------------------------
    // PHẦN 1: TẠO HỘP CÔNG CỤ HIỂN THỊ TỌA ĐỘ ĐI THEO CON TRỎ CHUỘT
    // ----------------------------------------------------
    
    const coordTooltip = document.createElement('div');
    coordTooltip.id = 'mouse-coord-tooltip';
    
    // ==========================================
    // CÁC THÔNG SỐ CẤU HÌNH GIAO DIỆN HỘP TỌA ĐỘ (TOOLTIP) THEO CHUỘT:
    // ==========================================
    const tooltipPosition = 'absolute';                     // Định vị tuyệt đối để hộp tự do dịch chuyển theo tọa độ pixel màn hình
    const tooltipBg = 'rgba(0, 0, 0, 0.75)';                // Màu nền đen mờ 75% giúp nổi bật văn bản mà không che khuất hẳn bản đồ bên dưới
    const tooltipColor = '#ffffff';                         // Màu sắc chữ hiển thị bên trong hộp (màu trắng sáng)
    const tooltipPaddingTopBot = '4px';                     // Khoảng cách đệm phía trên và phía bên dưới của hộp tọa độ
    const tooltipPaddingLeftRight = '8px';                  // Khoảng cách đệm phía bên trái và bên phải của hộp tọa độ
    const tooltipFontSize = '12px';                         // Kích thước cỡ chữ hiển thị bên trong hộp tọa độ
    const tooltipFontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"; // Bộ phông chữ chuẩn hiện đại, mượt mà
    const tooltipBorderRadius = '4px';                      // Bán kính bo tròn 4 góc của hộp tọa độ
    const tooltipPointerEvents = 'none';                    // Vô hiệu hóa mọi sự kiện tương tác chuột lên hộp để tránh cản trở thao tác click bản đồ
    const tooltipDisplay = 'none';                          // Trạng thái hiển thị mặc định là ẩn (chỉ hiện khi con trỏ di chuyển vào bản đồ)
    const tooltipZIndex = '1000';                           // Mức độ ưu tiên hiển thị lớp nằm ở tầng trên cùng so với các phần tử khác
    const tooltipWhiteSpace = 'nowrap';                     // Buộc nội dung văn bản luôn nằm trên một dòng duy nhất, không bị xuống dòng

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
    
    map.getContainer().appendChild(coordTooltip);

    // ----------------------------------------------------
    // PHẦN 2: LẮNG NGHE SỰ KIỆN DI CHUYỂN CHUỘT TRÊN BẢN ĐỒ (MOUSEMOVE)
    // ----------------------------------------------------
    map.on('mousemove', function (e) {
        const lng = e.lngLat.lng.toFixed(6); // Lấy kinh độ và làm tròn đến 6 chữ số thập phân
        const lat = e.lngLat.lat.toFixed(6); // Lấy vĩ độ và làm tròn đến 6 chữ số thập phân

        coordTooltip.innerHTML = `Lat: ${lat}, Lng: ${lng}`; // Cập nhật nội dung tọa độ vào hộp
        coordTooltip.style.display = 'block';                // Hiển thị hộp tọa độ lên màn hình

        const point = e.point;                               // Lấy tọa độ pixel màn hình của con trỏ chuột
        coordTooltip.style.left = (point.x + 15) + 'px';     // Đặt vị trí ngang của hộp cách chuột 15px về bên phải
        coordTooltip.style.top = (point.y + 15) + 'px';      // Đặt vị trí dọc của hộp cách chuột 15px xuống phía dưới
    });

    // ----------------------------------------------------
    // PHẦN 3: LẮNG NGHE SỰ KIỆN KHI CHUỘT RỜI KHỎI KHUNG BẢN ĐỒ (MOUSEOUT)
    // ----------------------------------------------------
    map.on('mouseout', function () {
        coordTooltip.style.display = 'none'; // Ẩn hộp tọa độ khi con trỏ chuột dịch chuyển ra khỏi khung bản đồ
    });

    // ----------------------------------------------------
    // PHẦN 4: TẠO NÚT BẤM "GHIM ĐIỂM" ĐỒNG BỘ TRONG CỤM ĐIỀU KHIỂN BẢN ĐỒ
    // ----------------------------------------------------
    let isPinModeActive = false; // Biến trạng thái: kiểm tra xem chế độ ghim điểm có đang được bật hay không

    class PinControl {
        onAdd(mapInstance) {
            this._map = mapInstance;
            this._container = document.createElement('div');
            this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group'; // Gắn class chuẩn giao diện điều khiển của MapLibre
            
            const pinButton = document.createElement('button');
            pinButton.type = 'button';
            pinButton.title = 'Bật/Tắt chế độ ghim địa điểm'; // Chú thích khi rê chuột vào nút
            pinButton.innerHTML = '📍';                      // Biểu tượng icon ghim trên nút bấm
            
            // ==========================================
            // CÁC THÔNG SỐ CẤU HÌNH GIAO DIỆN NÚT ĐIỀU KHIỂN GHIM TRÊN BẢN ĐỒ:
            // ==========================================
            const ctrlBtnWidth = '29px';           // Chiều rộng tiêu chuẩn của nút bấm trong cụm điều khiển MapLibre
            const ctrlBtnHeight = '29px';          // Chiều cao tiêu chuẩn của nút bấm trong cụm điều khiển MapLibre
            const ctrlBtnDisplay = 'flex';         // Sử dụng Flexbox để căn chỉnh nội dung icon vào chính giữa nút
            const ctrlBtnAlign = 'center';         // Căn chỉnh theo chiều dọc ở giữa ô
            const ctrlBtnJustify = 'center';       // Căn chỉnh theo chiều ngang ở giữa ô
            const ctrlBtnFontSize = '15px';        // Kích thước cỡ chữ của biểu tượng icon 📍 bên trong nút
            const ctrlBtnBorder = 'none';          // Loại bỏ hoàn toàn đường viền mặc định của trình duyệt
            const ctrlBtnBg = '#ffffff';           // Màu nền mặc định của nút bấm (màu trắng)
            const ctrlBtnCursor = 'pointer';       // Hiển thị con trỏ dạng bàn tay khi rê chuột vào nút
            const ctrlBtnOutline = 'none';         // Loại bỏ đường viền sáng khi bấm vào nút

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
            
            // Xử lý sự kiện khi người dùng click vào nút Ghim điểm
            pinButton.onclick = () => {
                isPinModeActive = !isPinModeActive; // Đảo ngược trạng thái bật/tắt
                
                if (isPinModeActive) {
                    pinButton.style.background = '#e8f0fe';         // Đổi màu nền sang xanh nhạt khi chế độ được kích hoạt
                    mapInstance.getContainer().style.cursor = 'crosshair'; // Đổi con trỏ chuột thành hình dấu cộng (+)
                } else {
                    pinButton.style.background = '#ffffff';         // Trả lại màu nền trắng ban đầu khi tắt
                    mapInstance.getContainer().style.cursor = '';          // Trả lại hình dạng con trỏ chuột mặc định
                }
            };
            
            this._container.appendChild(pinButton);
            return this._container;
        }

        onRemove() {
            this._container.parentNode.removeChild(this._container);
            this._map = undefined;
        }
    }

    map.addControl(new PinControl(), 'top-right'); // Thêm nút ghim vào góc trên bên phải bản đồ

    let tempMarker = null; // Biến lưu trữ đối tượng điểm ghim tạm thời trên bản đồ

    // ----------------------------------------------------
    // PHẦN 5: LẮNG NGHE SỰ KIỆN CLICK TRÊN BẢN ĐỒ (CHỈ HOẠT ĐỘNG KHI ĐÃ BẬT NÚT GHIM)
    // ----------------------------------------------------
    map.on('click', function (e) {
        if (!isPinModeActive) return;                                      // Nếu chưa bật chế độ ghim thì bỏ qua sự kiện click
        if (typeof isMeasuring !== 'undefined' && isMeasuring) return;     // Tránh xung đột nếu ứng dụng đang bật chế độ đo khoảng cách

        // Nếu đã có một điểm ghim tạm trước đó, hãy xóa nó đi để chỉ giữ lại 1 điểm ghim mới nhất
        if (tempMarker) {
            tempMarker.remove();
            tempMarker = null;
        }

        const clickedLng = e.lngLat.lng.toFixed(6); // Lấy kinh độ tại điểm click chuột
        const clickedLat = e.lngLat.lat.toFixed(6); // Lấy vĩ độ tại điểm click chuột

        // Khởi tạo phần tử chứa nội dung Popup
        const popupContent = document.createElement('div');
        
        // ==========================================
        // CÁC THÔNG SỐ CẤU HÌNH KHUNG POPUP TỔNG THỂ:
        // ==========================================
        const popupWidth = '150px';   // Chiều rộng tổng thể của khung popup (ví dụ: '150px')
        const popupPadding = '0px';   // Khoảng cách đệm bên trong khung popup (trên, dưới, trái, phải)
        const popupMargin = '0px';    // Khoảng cách lề bên ngoài khung popup
        const popupFont = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"; // Bộ phông chữ hiển thị cho toàn bộ popup

        popupContent.style.cssText = `
            font-family: ${popupFont};
            width: ${popupWidth};
            padding: ${popupPadding};
            margin: ${popupMargin};
        `;
        
        // ==========================================
        // CÁC THÔNG SỐ CẤU HÌNH CHO Ô NHẬP TÊN ĐỊA ĐIỂM (<input>):
        // ==========================================
        const inputWidth = '100%';             // Chiều rộng của ô nhập tên (chiếm 100% bề ngang khung popup)
        const inputPaddingTopBot = '3px';      // Khoảng cách đệm phía trên và phía dưới bên trong ô nhập tên
        const inputPaddingLeftRight = '5px';   // Khoảng cách đệm phía bên trái và bên phải bên trong ô nhập tên
        const inputFontSize = '11px';          // Kích thước cỡ chữ của văn bản trong ô nhập tên
        const inputBorder = '1px solid #ccc';  // Định dạng đường viền xung quanh ô nhập (độ dày 1px, nét liền, màu xám #ccc)
        const inputRadius = '3px';             // Bán kính bo tròn 4 góc của ô nhập tên
        const inputMarginBot = '3px';          // Khoảng cách khoảng trống (lề dưới) tách biệt ô nhập với dòng tọa độ phía dưới

        // ==========================================
        // CÁC THÔNG SỐ CẤU HÌNH CHO DÒNG HIỂN THỊ TỌA ĐỘ (<div>):
        // ==========================================
        const coordFontSize = '10px';          // Kích thước cỡ chữ hiển thị tọa độ (nhỏ gọn)
        const coordColor = '#555';             // Màu sắc chữ hiển thị tọa độ (màu xám tối)
        const coordMarginBot = '4px';          // Khoảng cách khoảng trống (lề dưới) tách biệt dòng tọa độ với nút bấm bên dưới
        const coordFontFamily = 'monospace';   // Kiểu phông chữ dạng mã nguồn (giúp các chữ số thẳng hàng đều nhau)

        // ==========================================
        // CÁC THÔNG SỐ CẤU HÌNH CHO NÚT BẤM "ĐÁNH DẤU" (<button>):
        // ==========================================
        const btnWidth = '100%';               // Chiều rộng của nút bấm (chiếm 100% bề ngang khung popup)
        const btnPaddingTopBot = '3px';        // Khoảng cách đệm phía trên và phía dưới bên trong nút bấm
        const btnPaddingLeftRight = '6px';     // Khoảng cách đệm phía bên trái và bên phải bên trong nút bấm
        const btnBgColor = '#1a73e8';          // Màu nền mặc định của nút bấm (màu xanh dương Google)
        const btnTextColor = '#fff';           // Màu sắc của chữ hiển thị trên nút bấm (màu trắng)
        const btnBorder = 'none';              // Loại bỏ hoàn toàn đường viền mặc định của nút
        const btnRadius = '3px';               // Bán kính bo tròn 4 góc của nút bấm
        const btnFontWeight = '500';           // Độ đậm nét của chữ trên nút bấm (Medium / 500)
        const btnFontSize = '11px';            // Kích thước cỡ chữ của chữ trên nút bấm

        // Xây dựng cấu trúc HTML bên trong Popup bao gồm ô nhập tên, tọa độ và nút bấm
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

        // ==========================================
        // CÁC THÔNG SỐ CẤU HÌNH CHO ĐỐI TƯỢNG POPUP VÀ MARKER (MAPLIBRE):
        // ==========================================
        const popupOffset = 15;        // Khoảng cách độ lệch pixel (offset) đẩy khung popup nằm cách phía trên đỉnh của điểm ghim
        const popupCloseButton = true; // Thiết lập hiển thị nút dấu X (true = hiển thị, false = ẩn) ở góc trên bên phải popup

        const popup = new maplibregl.Popup({ 
            offset: popupOffset, 
            closeButton: popupCloseButton 
        }).setDOMContent(popupContent);

        const markerColor = '#ea4335'; // Mã màu sắc biểu tượng ghim địa điểm trên bản đồ (màu đỏ cam đặc trưng #ea4335)

        // Khởi tạo điểm ghim Marker mới tại vị trí người dùng vừa click
        tempMarker = new maplibregl.Marker({ color: markerColor })
            .setLngLat([e.lngLat.lng, e.lngLat.lat])
            .setPopup(popup)
            .addTo(map);

        const actionBtn = popupContent.querySelector('#pin-action-btn');
        const nameInput = popupContent.querySelector('#place-name-input');

        // Xử lý sự kiện khi bấm nút "Đánh dấu" trong popup
        actionBtn.onclick = function (event) {
            const savedMarker = tempMarker;
            tempMarker = null;

            actionBtn.innerText = "Bỏ đánh dấu";                  // Đổi tên nhãn nút thành "Bỏ đánh dấu"
            actionBtn.style.background = "#d93025";               // Đổi màu nền nút sang màu đỏ cảnh báo
            nameInput.disabled = true;                            // Khóa ô nhập tên lại không cho chỉnh sửa nữa
            nameInput.style.background = "#f1f3f4";               // Đổi màu nền ô nhập thành xám nhạt thể hiện trạng thái khóa

            // Khi bấm lại vào nút "Bỏ đánh dấu", tiến hành xóa điểm ghim khỏi bản đồ
            actionBtn.onclick = function () {
                savedMarker.remove();
            };

            event.stopPropagation();
        };

        tempMarker.togglePopup(); // Tự động bật mở khung popup ngay sau khi ghim điểm lên bản đồ
    });
}
