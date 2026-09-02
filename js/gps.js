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
    
    // Tạo thẻ <div> động trong bộ nhớ dùng làm tooltip hiển thị tọa độ bay theo chuột
    const coordTooltip = document.createElement('div');
    coordTooltip.id = 'mouse-coord-tooltip';
    
    // Thiết lập phong cách hiển thị (CSS) trực tiếp bằng JavaScript cho tooltip tọa độ
    coordTooltip.style.cssText = `
        position: absolute;
        background: rgba(0, 0, 0, 0.75);
        color: #ffffff;
        padding: 4px 8px;
        font-size: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        border-radius: 4px;
        pointer-events: none;
        display: none;
        z-index: 1000;
        white-space: nowrap;
    `;
    
    map.getContainer().appendChild(coordTooltip);

    // ----------------------------------------------------
    // PHẦN 2: LẮNG NGHE SỰ KIỆN DI CHUYỂN CHUỘT TRÊN BẢN ĐỒ (MOUSEMOVE)
    // ----------------------------------------------------
    map.on('mousemove', function (e) {
        const lng = e.lngLat.lng.toFixed(6);
        const lat = e.lngLat.lat.toFixed(6);

        coordTooltip.innerHTML = `Lat: ${lat}, Lng: ${lng}`;
        coordTooltip.style.display = 'block';

        const point = e.point;
        coordTooltip.style.left = (point.x + 15) + 'px';
        coordTooltip.style.top = (point.y + 15) + 'px';
    });

    // ----------------------------------------------------
    // PHẦN 3: LẮNG NGHE SỰ KIỆN KHI CHUỘT RỜI KHỎI KHUNG BẢN ĐỒ (MOUSEOUT)
    // ----------------------------------------------------
    map.on('mouseout', function () {
        coordTooltip.style.display = 'none';
    });

    // ----------------------------------------------------
    // PHẦN 4: TẠO NÚT BẤM "GHIM ĐIỂM" ĐỒNG BỘ TRONG CỤM ĐIỀU KHIỂN BẢN ĐỒ
    // ----------------------------------------------------
    let isPinModeActive = false; // Trạng thái: Bật/Tắt chế độ ghim điểm

    // Khởi tạo Custom Control theo chuẩn giao diện của MapLibre GL
    class PinControl {
        onAdd(mapInstance) {
            this._map = mapInstance;
            this._container = document.createElement('div');
            // Sử dụng các class CSS chuẩn của MapLibre để đồng bộ kích thước, khung viền, bo góc và bóng đổ với cụm nút phóng to/thu nhỏ
            this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
            
            const pinButton = document.createElement('button');
            pinButton.type = 'button';
            pinButton.title = 'Bật/Tắt chế độ ghim địa điểm';
            pinButton.innerHTML = '📍'; // Biểu tượng ghim
            pinButton.style.cssText = `
                width: 29px;
                height: 29px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 15px;
                border: none;
                background: #ffffff;
                cursor: pointer;
                outline: none;
            `;
            
            // Xử lý sự kiện khi người dùng bấm vào nút Ghim trên giao diện
            pinButton.onclick = () => {
                isPinModeActive = !isPinModeActive; // Đảo trạng thái Bật <-> Tắt
                if (isPinModeActive) {
                    pinButton.style.background = '#e8f0fe'; // Đổi sang nền xanh nhạt báo hiệu đang bật chế độ ghim
                    mapInstance.getContainer().style.cursor = 'crosshair'; // Đổi hình con trỏ chuột thành dấu cộng (+)
                } else {
                    pinButton.style.background = '#ffffff'; // Trở về nền trắng bình thường
                    mapInstance.getContainer().style.cursor = ''; // Trả lại con trỏ chuột mặc định
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

    // Thêm nút Ghim vào góc trên bên phải bản đồ (nằm cùng cụm điều khiển giao diện)
    map.addControl(new PinControl(), 'top-right');

    // Biến giữ tham chiếu đến điểm ghim tạm chưa bấm lưu
    let tempMarker = null;

    // ----------------------------------------------------
    // PHẦN 5: LẮNG NGHE SỰ KIỆN CLICK TRÊN BẢN ĐỒ (CHỈ HOẠT ĐỘNG KHI ĐÃ BẬT NÚT GHIM)
    // ----------------------------------------------------
    map.on('click', function (e) {
        // Nếu chưa bật nút Ghim hoặc đang đo khoảng cách thì bỏ qua hoàn toàn sự kiện click
        if (!isPinModeActive) return;
        if (typeof isMeasuring !== 'undefined' && isMeasuring) return;

        // Nếu đã có một ghim tạm trước đó chưa lưu, tự động xóa đi
        if (tempMarker) {
            tempMarker.remove();
            tempMarker = null;
        }

        const clickedLng = e.lngLat.lng.toFixed(6);
        const clickedLat = e.lngLat.lat.toFixed(6);

        // Tạo phần tử nội dung popup được tối ưu tinh gọn, loại bỏ mọi khoảng trống thừa
        const popupContent = document.createElement('div');
        popupContent.style.cssText = "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; width: 150px; padding: 0px; margin: 0px;";
        
        // Cấu trúc nội dung siêu gọn: Ô nhập tên, dòng tọa độ thu gọn, nút Đánh dấu sát khít
        popupContent.innerHTML = `
            <input type="text" id="place-name-input" placeholder="Tên địa điểm..." value="Địa điểm mới" style="width: 100%; padding: 3px 5px; font-size: 11px; border: 1px solid #ccc; border-radius: 3px; box-sizing: border-box; margin-bottom: 3px; outline: none;" />
            <div style="font-size: 10px; color: #555; margin-bottom: 4px; font-family: monospace;">${clickedLat}, ${clickedLng}</div>
            <button id="pin-action-btn" style="width: 100%; padding: 3px 6px; background: #1a73e8; color: #fff; border: none; border-radius: 3px; cursor: pointer; font-weight: 500; font-size: 11px;">Đánh dấu</button>
        `;

        // Khởi tạo popup của MapLibre với độ lệch cực nhỏ để sát khít với ghim
        const popup = new maplibregl.Popup({ offset: 15, closeButton: true }).setDOMContent(popupContent);

        // Tạo Marker mới tại vị trí click
        tempMarker = new maplibregl.Marker({ color: '#ea4335' })
            .setLngLat([e.lngLat.lng, e.lngLat.lat])
            .setPopup(popup)
            .addTo(map);

        const actionBtn = popupContent.querySelector('#pin-action-btn');
        const nameInput = popupContent.querySelector('#place-name-input');

        // Xử lý khi bấm nút "Đánh dấu"
        actionBtn.onclick = function (event) {
            const savedMarker = tempMarker;
            tempMarker = null; // Xóa tham chiếu tạm

            // Chuyển sang trạng thái đã lưu
            actionBtn.innerText = "Bỏ đánh dấu";
            actionBtn.style.background = "#d93025"; // Đổi sang màu đỏ
            nameInput.disabled = true;              // Khóa tên không cho sửa
            nameInput.style.background = "#f1f3f4"; // Đổi màu xám nền input

            // Gán lại sự kiện click lần sau: Bấm để XÓA ghim khỏi bản đồ
            actionBtn.onclick = function () {
                savedMarker.remove();
            };

            event.stopPropagation();
        };

        // Tự động mở popup ngay khi ghim xuất hiện
        tempMarker.togglePopup();
    });
}
