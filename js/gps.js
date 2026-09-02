// ==========================================
// gps.js - HỆ THỐNG HIỂN THỊ TỌA ĐỘ THEO CHUỘT VÀ GHIM ĐIỂM (MAPLIBRE GL)
// ==========================================

function initGPSControl(map) {
    // ----------------------------------------------------
    // PHẦN 1: TẠO HỘP CÔNG CỤ HIỂN THỊ TỌA ĐỘ ĐI THEO CON TRỎ CHUỘT
    // ----------------------------------------------------
    const coordTooltip = document.createElement('div');
    coordTooltip.id = 'mouse-coord-tooltip';
    
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
    // PHẦN 4: LẮNG NGHE SỰ KIỆN CLICK TRÊN BẢN ĐỒ ĐỂ GHIM ĐIỂM
    // ----------------------------------------------------
    map.on('click', function (e) {
        // Nếu đang trong chế độ đo đạc (measure) thì bỏ qua
        if (typeof isMeasuring !== 'undefined' && isMeasuring) return;

        const clickedLng = e.lngLat.lng.toFixed(6);
        const clickedLat = e.lngLat.lat.toFixed(6);

        // Tạo nội dung Popup của MapLibre
        const popupContent = document.createElement('div');
        popupContent.style.cssText = "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 200px; padding: 2px;";
        popupContent.innerHTML = `
            <input type="text" id="place-name-input" placeholder="Nhập tên địa điểm..." value="Địa điểm mới" style="width: 100%; padding: 6px; font-size: 13px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; margin-bottom: 6px;" />
            <div style="font-size: 12px; color: #5f6368; margin-bottom: 8px; font-family: monospace;">${clickedLat}, ${clickedLng}</div>
            <button id="pin-action-btn" style="width: 100%; padding: 6px 12px; background: #1a73e8; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; font-size: 12px;">Đánh dấu</button>
        `;

        const popup = new maplibregl.Popup({ offset: 25 }).setDOMContent(popupContent);

        // Tạo Marker mới tại vị trí click và lưu lại trên map
        const marker = new maplibregl.Marker({ color: '#ea4335' })
            .setLngLat([e.lngLat.lng, e.lngLat.lat])
            .setPopup(popup)
            .addTo(map);

        // Biến trạng thái ghim (true: đã lưu đánh dấu, false: chưa đánh dấu)
        let isMarked = false;

        const actionBtn = popupContent.querySelector('#pin-action-btn');
        const nameInput = popupContent.querySelector('#place-name-input');

        actionBtn.onclick = function () {
            if (!isMarked) {
                // Chuyển sang trạng thái Đã đánh dấu (Lưu điểm trên map)
                isMarked = true;
                actionBtn.innerText = "Bỏ đánh dấu";
                actionBtn.style.background = "#ea4335"; // Đổi sang màu đỏ
                nameInput.disabled = khóaTên = true; // Khóa tên lại khi đã lưu
                popup.setOptions({ closeOnClick: false }); // Giữ popup ghim cố định khi click ra ngoài
            } else {
                // Nhấp vào ghim cũ để Bỏ đánh dấu -> Xóa điểm khỏi bản đồ
                marker.remove();
            }
        };

        marker.togglePopup();
    });
}
