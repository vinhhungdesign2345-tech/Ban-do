// ==========================================
// gps.js - HỆ THỐNG HIỂN THỊ TỌA ĐỘ CỐ ĐỊNH MÉP DƯỚI VÀ GHIM ĐIỂM (MAPLIBRE GL)
// ==========================================

/**
 * Hàm khởi tạo toàn bộ tính năng GPS, tọa độ chuột, nút Ghim điểm và khôi phục điểm ghim từ localStorage.
 * @param {maplibregl.Map} map - Đối tượng bản đồ chính của ứng dụng.
 */
function initGPSControl(map) {
    
    // ----------------------------------------------------
    // PHẦN 1: TẠO HỘP CÔNG CỤ HIỂN THỊ TỌA ĐỘ CỐ ĐỊNH Ở MÉP DƯỚI BẢN ĐỒ
    // ----------------------------------------------------
    
    // Tạo một thẻ phần tử `div` động trong DOM để chứa nội dung tọa độ ở góc bản đồ
    const coordTooltip = document.createElement('div');
    coordTooltip.id = 'mouse-coord-tooltip'; // Gán ID để dễ quản lý hoặc định nghĩa thêm trong CSS nếu cần
    
    // Định nghĩa các biến chứa thông số cấu hình giao diện cho thanh tọa độ cố định mép dưới
    const tooltipPosition = 'absolute';                           // Đặt vị trí tuyệt đối để neo vào khung chứa bản đồ
    const tooltipBottom = '55px';                                 // Khoảng cách neo từ mép dưới lên: 55 pixel
    const tooltipLeft = '10px';                                   // Khoảng cách neo từ mép trái sang: 10 pixel
    const tooltipBg = 'rgba(0, 0, 0, 0.75)';                      // Màu nền: Màu đen có độ trong suốt 75% tạo hiệu ứng tối giản
    const tooltipColor = '#ffffff';                               // Màu chữ: Màu trắng sáng giúp nổi bật trên nền tối
    const tooltipPaddingTopBot = '4px';                           // Khoảng đệm bên trong theo chiều dọc (trên/dưới)
    const tooltipPaddingLeftRight = '8px';                        // Khoảng đệm bên trong theo chiều ngang (trái/phải)
    const tooltipFontSize = '12px';                               // Cỡ chữ hiển thị: 12 pixel (nhỏ gọn, rõ ràng)
    const tooltipFontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"; // Bộ font chữ hệ thống hiện đại
    const tooltipBorderRadius = '4px';                            // Bo tròn 4 góc của hộp với bán kính 4 pixel
    const tooltipPointerEvents = 'none';                          // QUAN TRỌNG: Vô hiệu hóa mọi sự kiện chuột trên hộp
    const tooltipDisplay = 'block';                               // Trạng thái: Luôn hiển thị sẵn sàng trên bản đồ
    const tooltipZIndex = '1000';                                 // Mức hiển thị ưu tiên lớp (z-index): Đặt cao (1000) để luôn đè lên trên bản đồ
    const tooltipWhiteSpace = 'nowrap';                           // Ép nội dung tọa độ hiển thị trên một dòng duy nhất

    // Gom nhóm và gán chuỗi định dạng CSS hoàn chỉnh vào thuộc tính style của tooltip
    coordTooltip.style.cssText = `
        position: ${tooltipPosition};
        bottom: ${tooltipBottom};
        left: ${tooltipLeft};
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
    
    // Giá trị mặc định ban đầu khi chuột chưa vào bản đồ
    coordTooltip.innerHTML = 'Lat: --, Lng: --';

    // Đưa thẻ tọa độ vừa tạo vào bên trong khung chứa chính của bản đồ (Map Container)
    map.getContainer().appendChild(coordTooltip);

    // ----------------------------------------------------
    // PHẦN 2: LẮNG NGHE SỰ KIỆN DI CHUYỂN CHUỘT TRÊN BẢN ĐỒ (MOUSEMOVE)
    // ----------------------------------------------------
    map.on('mousemove', function (e) {
        // Lấy tọa độ Kinh độ (Lng) và Vĩ độ (Lat) tại vị trí con trỏ chuột, làm tròn chính xác đến 6 chữ số thập phân
        const lng = e.lngLat.lng.toFixed(6);
        const lat = e.lngLat.lat.toFixed(6);

        // Cập nhật nội dung tọa độ cố định tại ô ở mép dưới bản đồ
        coordTooltip.innerHTML = `Lat: ${lat}, Lng: ${lng}`;
    });

    // ----------------------------------------------------
    // PHẦN 3: LẮNG NGHE SỰ KIỆN KHI CHUỘT RỜI KHỎI KHUNG BẢN ĐỒ (MOUSEOUT)
    // ----------------------------------------------------
    map.on('mouseout', function () {
        // Trả về trạng thái chờ khi con trỏ chuột rê ra ngoài biên giới hạn của khung bản đồ
        coordTooltip.innerHTML = 'Lat: --, Lng: --';
    });

    // ----------------------------------------------------
    // PHẦN 4: HỆ THỐNG LƯU TRỮ VÀ KHÔI PHỤC ĐIỂM GHIM (QUẢN LÝ TRỰC TIẾP MẢNG JSON)
    // ----------------------------------------------------
    
    /**
     * Hàm kiểm tra localStorage khả dụng
     */
    function isLocalStorageAvailable() {
        try {
            const testKey = '__test_storage__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Hàm lấy danh sách điểm ghim từ localStorage
     */
    function getStoredMarkers() {
        if (!isLocalStorageAvailable()) return [];
        const data = localStorage.getItem('pinned_locations');
        try {
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    /**
     * Hàm lưu một điểm mới vào localStorage
     */
    function saveMarkerToStorage(markerData) {
        if (!isLocalStorageAvailable()) return;
        const markers = getStoredMarkers();
        const existingIndex = markers.findIndex(m => m.id === markerData.id);
        if (existingIndex >= 0) {
            markers[existingIndex] = markerData;
        } else {
            markers.push(markerData);
        }
        localStorage.setItem('pinned_locations', JSON.stringify(markers));
    }

    /**
     * Hàm xóa một điểm ra khỏi localStorage dựa vào ID
     */
    function removeMarkerFromStorage(markerId) {
        if (!isLocalStorageAvailable()) return;
        let markers = getStoredMarkers();
        markers = markers.filter(m => m.id !== markerId);
        localStorage.setItem('pinned_locations', JSON.stringify(markers));
    }

    /**
     * Hàm dựng điểm ghim chính thức lên bản đồ.
     */
    function createPermanentMarker(mapInstance, lng, lat, placeName, markerId = null, isRestoring = false) {
        const uniqueId = markerId || 'marker_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

        const popupContent = document.createElement('div');
        
        const popupWidth = '150px';
        const popupPadding = '0px';
        const popupMargin = '0px';
        const popupFont = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

        popupContent.style.cssText = `
            font-family: ${popupFont};
            width: ${popupWidth};
            padding: ${popupPadding};
            margin: ${popupMargin};
        `;

        popupContent.innerHTML = `
            <input type="text" value="${placeName}" disabled style="
                width: 100%; 
                padding: 3px 5px; 
                font-size: 13px; 
                border: 1px solid #ccc; 
                border-radius: 3px; 
                box-sizing: border-box; 
                margin-bottom: 3px; 
                background: #f1f3f4;
                outline: none;
            " />
            
            <div style="
                font-size: 12px; 
                color: #555; 
                margin-bottom: 4px; 
                font-family: monospace;
            ">
                ${lat}, ${lng}
            </div>
            
            <button id="remove-btn-${uniqueId}" style="
                width: 100%; 
                padding: 3px 6px; 
                background: #d93025; 
                color: #fff; 
                border: none; 
                border-radius: 3px; 
                cursor: pointer; 
                font-weight: 500; 
                font-size: 11px;
            ">
                Bỏ đánh dấu
            </button>
        `;

        // Thêm maxWidth: '180px' để chặn mobile tự động phóng to khung popup
        const popup = new maplibregl.Popup({ 
            offset: 15, 
            closeButton: true,
            maxWidth: '180px' 
        }).setDOMContent(popupContent);

        const markerEl = document.createElement('div');
        markerEl.style.cssText = `
            width: 14px;
            height: 14px;
            background-color: #ea4335;
            border: 2px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: pointer;
        `;

        const permanentMarker = new maplibregl.Marker({ element: markerEl })
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(mapInstance);

        // Xử lý sự kiện khi bấm nút "Bỏ đánh dấu"
        const removeBtn = popupContent.querySelector(`#remove-btn-${uniqueId}`);
        removeBtn.onclick = function (event) {
            permanentMarker.remove();
            removeMarkerFromStorage(uniqueId);
            event.stopPropagation();
        };

        // Nếu là tạo mới, lưu vào localStorage
        if (!isRestoring) {
            saveMarkerToStorage({
                id: uniqueId,
                lng: parseFloat(lng),
                lat: parseFloat(lat),
                name: placeName
            });
        }
    }

    /**
     * Hàm tự động khôi phục toàn bộ danh sách điểm ghim từ localStorage khi khởi động bản đồ.
     */
    function loadSavedMarkers(mapInstance) {
        const storedLocations = getStoredMarkers();
        if (storedLocations.length === 0) return;

        storedLocations.forEach(loc => {
            createPermanentMarker(mapInstance, loc.lng, loc.lat, loc.name, loc.id, true);
        });
    }

    // Tải lại điểm ghim cũ ngay khi khởi tạo
    if (map.loaded()) {
        loadSavedMarkers(map);
    } else {
        map.on('load', function () {
            loadSavedMarkers(map);
        });
    }

    // ----------------------------------------------------
    // PHẦN 5: TẠO NÚT BẤM "GHIM ĐIỂM" ĐỒNG BỘ TRONG CỤM ĐIỀU KHIỂN BẢN ĐỒ
    // ----------------------------------------------------
    let isPinModeActive = false; // Biến cờ kiểm tra trạng thái bật/tắt chế độ ghim điểm

    class PinControl {
        onAdd(mapInstance) {
            this._map = mapInstance;
            this._container = document.createElement('div');
            this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
            
            const pinButton = document.createElement('button');
            pinButton.type = 'button';
            pinButton.title = 'Bật/Tắt chế độ ghim địa điểm';
            pinButton.innerHTML = '📍';
            
            const ctrlBtnWidth = '100%';
            const ctrlBtnHeight = '100%';
            const ctrlBtnDisplay = 'flex';
            const ctrlBtnAlign = 'center';
            const ctrlBtnJustify = 'center';
            const ctrlBtnFontSize = '15px';
            const ctrlBtnBorder = 'none';
            const ctrlBtnBg = 'transparent';
            const ctrlBtnCursor = 'pointer';
            const ctrlBtnOutline = 'none';

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
            
            pinButton.onclick = () => {
                isPinModeActive = !isPinModeActive;
                
                if (isPinModeActive) {
                    pinButton.style.background = '#6a9ceb';
                } else {
                    pinButton.style.background = 'transparent';
                    
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

    map.addControl(new PinControl(), 'top-right');

    let tempMarker = null;

    // ----------------------------------------------------
    // PHẦN 6: LẮNG NGHE SỰ KIỆN CLICK TRÊN BẢN ĐỒ ĐỂ TẠO ĐIỂM GHIM TẠM THỜI
    // ----------------------------------------------------
    map.on('click', function (e) {
        if (!isPinModeActive) return;
        if (typeof isMeasuring !== 'undefined' && isMeasuring) return;

        if (tempMarker) {
            tempMarker.remove();
            tempMarker = null;
        }

        const clickedLng = e.lngLat.lng.toFixed(6);
        const clickedLat = e.lngLat.lat.toFixed(6);

        const popupContent = document.createElement('div');
        
        const popupWidth = '150px';
        const popupPadding = '0px';
        const popupMargin = '0px';
        const popupFont = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

        popupContent.style.cssText = `
            font-family: ${popupFont};
            width: ${popupWidth};
            padding: ${popupPadding};
            margin: ${popupMargin};
        `;
        
        const inputWidth = '100%';
        const inputPaddingTopBot = '3px';
        const inputPaddingLeftRight = '5px';
        const inputFontSize = '13px';
        const inputBorder = '1px solid #ccc';
        const inputRadius = '3px';
        const inputMarginBot = '3px';

        const coordFontSize = '12px';
        const coordColor = '#555';
        const coordMarginBot = '4px';
        const coordFontFamily = 'monospace';

        const btnWidth = '100%';
        const btnPaddingTopBot = '3px';
        const btnPaddingLeftRight = '6px';
        const btnBgColor = '#1a73e8';
        const btnTextColor = '#fff';
        const btnBorder = 'none';
        const btnRadius = '3px';
        const btnFontWeight = '500';
        const btnFontSize = '11px';

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

        const popupOffset = 15;
        const popupCloseButton = true;

        // Thêm maxWidth: '180px' để đồng bộ giao diện gọn gàng trên mobile
        const popup = new maplibregl.Popup({ 
            offset: popupOffset, 
            closeButton: popupCloseButton,
            maxWidth: '180px' 
        }).setDOMContent(popupContent);

        const markerEl = document.createElement('div');
        const markerWidth = '14px';
        const markerHeight = '14px';
        const markerBgColor = '#ea4335';
        const markerBorder = '2px solid #ffffff';
        const markerRadius = '50%';
        const markerShadow = '0 2px 4px rgba(0,0,0,0.3)';
        const markerCursor = 'pointer';

        markerEl.style.cssText = `
            width: ${markerWidth};
            height: ${markerHeight};
            background-color: ${markerBgColor};
            border: ${markerBorder};
            border-radius: ${markerRadius};
            box-shadow: ${markerShadow};
            cursor: ${markerCursor};
        `;

        tempMarker = new maplibregl.Marker({ element: markerEl })
            .setLngLat([e.lngLat.lng, e.lngLat.lat])
            .setPopup(popup)
            .addTo(map);

        const actionBtn = popupContent.querySelector('#pin-action-btn');
        const nameInput = popupContent.querySelector('#place-name-input');

        let isClearedDefaultName = false;
        nameInput.onfocus = function() {
            if (!isClearedDefaultName && nameInput.value === "Địa điểm mới") {
                nameInput.value = "";
                isClearedDefaultName = true;
            }
        };

        actionBtn.onclick = function (event) {
            const currentLng = e.lngLat.lng;
            const currentLat = e.lngLat.lat;
            const currentName = nameInput.value || "Địa điểm mới";

            tempMarker.remove();
            tempMarker = null;

            createPermanentMarker(map, currentLng, currentLat, currentName);

            event.stopPropagation();
        };

        tempMarker.togglePopup();
    });
}
