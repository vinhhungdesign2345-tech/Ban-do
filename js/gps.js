// ==========================================
// gps.js - HỆ THỐNG HIỂN THỊ TỌA ĐỘ THEO CHUỘT VÀ GHIM ĐIỂM (MAPLIBRE GL)
// ==========================================

/**
 * Hàm khởi tạo toàn bộ tính năng GPS, tọa độ chuột và nút Ghim điểm trên bản đồ MapLibre.
 * @param {maplibregl.Map} map - Đối tượng bản đồ chính của ứng dụng.
 */
function initGPSControl(map) {
    
    // ====================================================
    // PHẦN 1: TẠO HỘP CÔNG CỤ (TOOLTIP) HIỂN THỊ TỌA ĐỘ ĐI THEO CON TRỎ CHUỘT
    // ====================================================
    
    // Tạo thẻ div chứa nội dung hiển thị tọa độ
    const coordTooltip = document.createElement('div');
    coordTooltip.id = 'mouse-coord-tooltip'; // Đặt ID để dễ kiểm soát CSS nếu cần
    
    // Các thông số cấu hình giao diện cho Tooltip hiển thị tọa độ
    const tooltipPosition = 'absolute';           // Định vị tuyệt đối trên khung chứa bản đồ
    const tooltipBg = 'rgba(0, 0, 0, 0.75);';     // Màu nền đen mờ (độ trong suốt 75%)
    const tooltipColor = '#ffffff';               // Màu chữ trắng
    const tooltipPaddingTopBot = '4px';           // Khoảng cách đệm trên/dưới của hộp chữ
    const tooltipPaddingLeftRight = '8px';        // Khoảng cách đệm trái/phải của hộp chữ
    const tooltipFontSize = '12px';               // Cỡ chữ hiển thị tọa độ
    const tooltipFontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"; // Phông chữ tiêu chuẩn, hiện đại
    const tooltipBorderRadius = '4px';            // Độ bo tròn các góc của hộp chữ
    const tooltipPointerEvents = 'none';          // Vô hiệu hóa tương chuột qua hộp này (tránh cản trở click bản đồ)
    const tooltipDisplay = 'none';                // Mặc định ẩn đi khi chuột chưa vào bản đồ
    const tooltipZIndex = '100';                  // Đảm bảo hiển thị nổi lên trên cùng của bản đồ
    const tooltipWhiteSpace = 'nowrap';           // Không cho phép chữ bị xuống dòng

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

    // ====================================================
    // PHẦN 4: TẠO NÚT BẤM "GHIM ĐIỂM" TÙY CHỈNH TRONG CỤM ĐIỀU KHIỂN BẢN ĐỒ
    // ====================================================
    let isPinModeActive = false; // Biến cờ (flag) theo dõi trạng thái: Bật (true) hay Tắt (false) chế độ ghim

    // Định nghĩa lớp điều khiển tùy chỉnh (Custom Control) tuân theo chuẩn của MapLibre GL
    class PinControl {
        onAdd(mapInstance) {
            this._map = mapInstance;
            this._container = document.createElement('div');
            this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group'; // Lớp CSS gốc của MapLibre để đồng bộ giao diện nút bấm
            
            // Tạo nút bấm (button) thực tế
            const pinButton = document.createElement('button');
            pinButton.type = 'button';
            pinButton.title = 'Bật/Tắt chế độ ghim địa điểm'; // Chú thích khi rê chuột vào nút
            pinButton.innerHTML = '📍';                      // Biểu tượng icon ghim địa điểm
            
            // Các thông số cấu hình giao diện riêng cho nút bấm điều khiển
            const ctrlBtnWidth = '29px';         // Chiều rộng nút (chuẩn MapLibre)
            const ctrlBtnHeight = '29px';        // Chiều cao nút (chuẩn MapLibre)
            const ctrlBtnDisplay = 'flex';       // Kiểu hiển thị dạng Flexbox để căn chỉnh icon
            const ctrlBtnAlign = 'center';       // Căn giữa theo chiều dọc
            const ctrlBtnJustify = 'center';     // Căn giữa theo chiều ngang
            const ctrlBtnFontSize = '15px';      // Cỡ icon bên trong nút
            const ctrlBtnBorder = 'none';        // Không viền ngoài
            const ctrlBtnBg = '#ffffff';         // Màu nền mặc định của nút (trắng)
            const ctrlBtnCursor = 'pointer';     // Biểu tượng con trỏ dạng bàn tay khi hover
            const ctrlBtnOutline = 'none';       // Bỏ viền sáng xanh mặc định của trình duyệt khi click

            // Gán các thông số CSS vào nút ghim
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
            
            // Sự kiện khi người dùng click vào nút ghim
            pinButton.onclick = () => {
                isPinModeActive = !isPinModeActive; // Đảo ngược trạng thái Bật/Tắt
                
                if (isPinModeActive) {
                    pinButton.style.background = '#e8f0fe'; // Đổi màu nền sang xanh nhạt báo hiệu đang bật
                    mapInstance.getContainer().style.cursor = 'crosshair'; // Đổi con trỏ chuột thành hình dấu cộng (+)
                } else {
                    pinButton.style.background = '#ffffff'; // Trả về màu nền trắng ban đầu
                    mapInstance.getContainer().style.cursor = ''; // Trả con trỏ chuột về mặc định
                    
                    // Nếu đang có điểm ghim tạm mà tắt chế độ đi thì tự động xóa điểm tạm đó luôn
                    if (tempMarker) {
                        tempMarker.remove();
                        tempMarker = null;
                    }
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

    // Đưa cụm nút ghim vào góc trên bên phải của bản đồ ('top-right')
    map.addControl(new PinControl(), 'top-right');

    let tempMarker = null; // Biến lưu trữ đối tượng Marker tạm thời đang hiển thị trên bản đồ

    // ====================================================
    // PHẦN 5: LẮNG NGHE SỰ KIỆN CLICK TRÊN BẢN ĐỒ ĐỂ TẠO ĐIỂM GHIM
    // ====================================================
    map.on('click', function (e) {
        // Kiểm tra điều kiện: Nếu chưa bật chế độ ghim HOẶC đang bật công cụ đo khoảng cách thì không làm gì cả
        if (!isPinModeActive) return;
        if (typeof isMeasuring !== 'undefined' && isMeasuring) return;

        // Dọn dẹp điểm ghim tạm cũ ngay lập tức (nếu có tồn tại) để tránh xung đột luồng và tràn bộ nhớ
        if (tempMarker) {
            tempMarker.remove();
            tempMarker = null;
        }

        // Lấy tọa độ chính xác tại điểm người dùng click chuột
        const clickedLng = e.lngLat.lng.toFixed(6);
        const clickedLat = e.lngLat.lat.toFixed(6);

        // Tạo khung chứa nội dung cho bảng thông tin (Popup) đính kèm trên điểm ghim
        const popupContent = document.createElement('div');
        
        // Các thông số giao diện cho khung Popup
        const popupWidth = '150px';          // Chiều rộng hộp Popup
        const popupPadding = '0px';          // Khoảng đệm bên trong
        const popupMargin = '0px';           // Khoảng cách bên ngoài
        const popupFont = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"; // Phông chữ

        popupContent.style.cssText = `
            font-family: ${popupFont};
            width: ${popupWidth};
            padding: ${popupPadding};
            margin: ${popupMargin};
        `;
        
        // Cấu hình giao diện cho ô nhập tên địa điểm (Input)
        const inputWidth = '100%';
        const inputPaddingTopBot = '3px';
        const inputPaddingLeftRight = '5px';
        const inputFontSize = '13px';
        const inputBorder = '1px solid #ccc'; // Đường viền xám nhạt
        const inputRadius = '3px';            // Bo góc ô nhập
        const inputMarginBot = '3px';         // Khoảng cách dưới so với thành phần tiếp theo

        // Cấu hình giao diện cho dòng hiển thị tọa độ phụ đề trong Popup
        const coordFontSize = '12px';
        const coordColor = '#555';            // Màu chữ xám đậm
        const coordMarginBot = '4px';
        const coordFontFamily = 'monospace';  // Dùng phông chữ dạng mã nguồn để hiển thị số đẹp hơn

        // Cấu hình giao diện cho nút hành động ("Đánh dấu" / "Bỏ đánh dấu")
        const btnWidth = '100%';
        const btnPaddingTopBot = '3px';
        const btnPaddingLeftRight = '6px';
        const btnBgColor = '#1a73e8';         // Màu xanh dương chủ đạo của nút
        const btnTextColor = '#fff';          // Chữ màu trắng
        const btnBorder = 'none';
        const btnRadius = '3px';
        const btnFontWeight = '500';          // Độ đậm của chữ
        const btnFontSize = '11px';

        // Đổ mã HTML chứa cấu trúc giao diện Popup vào thẻ div
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

        // Khởi tạo đối tượng Popup của MapLibre
        const popupOffset = 15;         // Khoảng cách nhô lên của popup so với đỉnh điểm ghim
        const popupCloseButton = true;  // Hiển thị nút dấu X (close) ở góc popup

        const popup = new maplibregl.Popup({ 
            offset: popupOffset, 
            closeButton: popupCloseButton 
        }).setDOMContent(popupContent);

        // Khởi tạo và đưa đối tượng Marker (Điểm ghim) lên bản đồ
        const markerColor = '#ea4335'; // Màu đỏ đặc trưng cho điểm ghim

        tempMarker = new maplibregl.Marker({ color: markerColor })
            .setLngLat([e.lngLat.lng, e.lngLat.lat]) // Gán tọa độ theo vị trí click
            .setPopup(popup)                         // Đính kèm bảng Popup vào điểm ghim này
            .addTo(map);                             // Thêm hiển thị trực tiếp lên bản đồ

        // Lấy tham chiếu đến các phần tử tương tác bên trong Popup vừa tạo
        const actionBtn = popupContent.querySelector('#pin-action-btn');
        const nameInput = popupContent.querySelector('#place-name-input');

        // Tự động xóa chữ "Địa điểm mới" mặc định khi người dùng bấm vào ô nhập tên
        let isClearedDefaultName = false;
        nameInput.onfocus = function() {
            if (!isClearedDefaultName && nameInput.value === "Địa điểm mới") {
                nameInput.value = "";
                isClearedDefaultName = true;
            }
        };

        // Xử lý sự kiện khi người dùng bấm vào nút "Đánh dấu"
        actionBtn.onclick = function (event) {
            const savedMarker = tempMarker; // Lưu lại điểm ghim hiện tại thành điểm cố định chính thức
            tempMarker = null;              // Ngắt liên kết biến tạm để chuẩn bị cho việc tạo điểm ghim mới tiếp theo

            // Đổi giao diện nút thành trạng thái "Đã lưu / Bỏ đánh dấu"
            actionBtn.innerText = "Bỏ đánh dấu";                            
            actionBtn.style.background = "#d93025"; // Đổi sang màu đỏ                        
            nameInput.disabled = true;              // Khóa ô nhập tên lại không cho sửa                                       
            nameInput.style.background = "#f1f3f4"; // Làm xám nền ô nhập để biểu thị trạng thái đã khóa                            

            // Đổi hành vi của nút: Khi bấm lại vào nút này thì sẽ xóa hẳn điểm ghim tạm khỏi bản đồ
            actionBtn.onclick = function () {
                savedMarker.remove();
            };

            event.stopPropagation(); // Ngăn sự kiện click lan truyền ngược lên bản đồ
        };

        // Tự động bật mở bảng Popup ngay khi vừa tạo xong điểm ghim
        tempMarker.togglePopup();
    });
}
