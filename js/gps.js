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
    
    const tooltipPosition = 'absolute';
    const tooltipBg = 'rgba(0, 0, 0, 0.75)';
    const tooltipColor = '#ffffff';
    const tooltipPaddingTopBot = '4px';
    const tooltipPaddingLeftRight = '8px';
    const tooltipFontSize = '12px';
    const tooltipFontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    const tooltipBorderRadius = '4px';
    const tooltipPointerEvents = 'none';
    const tooltipDisplay = 'none';
    const tooltipZIndex = '1000';
    const tooltipWhiteSpace = 'nowrap';

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
    let isPinModeActive = false;

    class PinControl {
        onAdd(mapInstance) {
            this._map = mapInstance;
            this._container = document.createElement('div');
            this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
            
            const pinButton = document.createElement('button');
            pinButton.type = 'button';
            pinButton.title = 'Bật/Tắt chế độ ghim địa điểm';
            pinButton.innerHTML = '📍';
            
            const ctrlBtnWidth = '29px';
            const ctrlBtnHeight = '29px';
            const ctrlBtnDisplay = 'flex';
            const ctrlBtnAlign = 'center';
            const ctrlBtnJustify = 'center';
            const ctrlBtnFontSize = '15px';
            const ctrlBtnBorder = 'none';
            const ctrlBtnBg = '#ffffff';
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
                    pinButton.style.background = '#e8f0fe';
                    mapInstance.getContainer().style.cursor = 'crosshair';
                } else {
                    pinButton.style.background = '#ffffff';
                    mapInstance.getContainer().style.cursor = '';
                    
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
    // PHẦN 5: LẮNG NGHE SỰ KIỆN CLICK TRÊN BẢN ĐỒ
    // ----------------------------------------------------
    map.on('click', function (e) {
        if (!isPinModeActive) return;
        if (typeof isMeasuring !== 'undefined' && isMeasuring) return;

        // Xóa ngay lập tức điểm ghim tạm cũ (nếu có) để giải phóng hoàn toàn bộ nhớ và trạng thái
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

        const popup = new maplibregl.Popup({ 
            offset: popupOffset, 
            closeButton: popupCloseButton 
        }).setDOMContent(popupContent);

        const markerColor = '#ea4335';

        tempMarker = new maplibregl.Marker({ color: markerColor })
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

        let isMarked = false; 

        // Sự kiện close giữ lại để phòng hờ khi người dùng bấm dấu X hoặc click ra ngoài bản đồ
        popup.on('close', function() {
            if (!isMarked && tempMarker) {
                tempMarker.remove();
                tempMarker = null;
            }
        });

        actionBtn.onclick = function (event) {
            isMarked = true;      
            const savedMarker = tempMarker;
            tempMarker = null;    

            actionBtn.innerText = "Bỏ đánh dấu";                            
            actionBtn.style.background = "#d93025";                            
            nameInput.disabled = true;                                         
            nameInput.style.background = "#f1f3f4";                            

            actionBtn.onclick = function () {
                savedMarker.remove();
            };

            event.stopPropagation();
        };

        tempMarker.togglePopup();
    });
}
