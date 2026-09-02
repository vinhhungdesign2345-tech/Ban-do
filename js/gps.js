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
    // PHẦN 2: KHAI BÁO BIẾN LƯU TRỮ ĐIỂM GHIM TRÊN BẢN ĐỒ
    // ----------------------------------------------------
    let pinnedMarker = null;

    // ----------------------------------------------------
    // PHẦN 3: LẮNG NGHE SỰ KIỆN DI CHUYỂN CHUỘT TRÊN BẢN ĐỒ (MOUSEMOVE)
    // ----------------------------------------------------
    map.on('mousemove', function (e) {
        // MapLibre dùng e.lngLat thay vì e.latlng của Leaflet
        const lng = e.lngLat.lng.toFixed(6);
        const lat = e.lngLat.lat.toFixed(6);

        coordTooltip.innerHTML = `Lat: ${lat}, Lng: ${lng}`;
        coordTooltip.style.display = 'block';

        // MapLibre dùng e.point (tọa độ pixel trên khung chứa)
        const point = e.point;
        coordTooltip.style.left = (point.x + 15) + 'px';
        coordTooltip.style.top = (point.y + 15) + 'px';
    });

    // ----------------------------------------------------
    // PHẦN 4: LẮNG NGHE SỰ KIỆN KHI CHUỘT RỜI KHỎI KHUNG BẢN ĐỒ (MOUSEOUT)
    // ----------------------------------------------------
    map.on('mouseout', function () {
        coordTooltip.style.display = 'none';
    });

    // ----------------------------------------------------
    // PHẦN 5: LẮNG NGHE SỰ KIỆN CLICK TRÊN BẢN ĐỒ ĐỂ GHIM ĐIỂM
    // ----------------------------------------------------
    map.on('click', function (e) {
        // Nếu đang trong chế độ đo đạc (measure) thì bỏ qua
        if (typeof isMeasuring !== 'undefined' && isMeasuring) return;

        const clickedLng = e.lngLat.lng.toFixed(6);
        const clickedLat = e.lngLat.lat.toFixed(6);

        // Xóa marker cũ nếu đã tồn tại
        if (pinnedMarker) {
            pinnedMarker.remove();
        }

        // Tạo nội dung Popup của MapLibre
        const popupContent = document.createElement('div');
        popupContent.style.cssText = "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 160px; padding: 2px;";
        popupContent.innerHTML = `
            <b style="color: #1a73e8; font-size: 14px;">📍 Tọa độ đã ghim</b>
            <hr style="margin: 6px 0; border: none; border-top: 1px solid #dadce0;">
            <span style="font-size: 13px; color: #3c4043;"><b>Vĩ độ (Lat):</b> ${clickedLat}</span><br>
            <span style="font-size: 13px; color: #3c4043; margin-bottom: 8px; display: inline-block;"><b>Kinh độ (Lng):</b> ${clickedLng}</span>
            <button id="remove-pin-btn" style="width: 100%; padding: 6px 12px; background: #ea4335; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 12px;">Bỏ ghim</button>
        `;

        // Xử lý sự kiện bấm nút bỏ ghim bên trong popup
        const removeBtn = popupContent.querySelector('#remove-pin-btn');
        removeBtn.onclick = function () {
            if (pinnedMarker) {
                pinnedMarker.remove();
                pinnedMarker = null;
            }
        };

        const popup = new maplibregl.Popup({ offset: 25 }).setDOMContent(popupContent);

        // Tạo Marker mới bằng chuẩn maplibregl.Marker
        pinnedMarker = new maplibregl.Marker({ color: '#ea4335' })
            .setLngLat([e.lngLat.lng, e.lngLat.lat])
            .setPopup(popup)
            .addTo(map);

        pinnedMarker.togglePopup();
    });
}
