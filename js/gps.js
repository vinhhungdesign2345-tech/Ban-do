// ==========================================
// gps.js - HỆ THỐNG HIỂN THỊ TỌA ĐỘ CỐ ĐỊNH MÉP DƯỚI VÀ GHIM ĐIỂM (MAPLIBRE GL)
// ==========================================

function initGPSControl(map) {
    
    // ----------------------------------------------------
    // PHẦN 1: TẠO HỘP CÔNG CỤ HIỂN THỊ TỌA ĐỘ CỐ ĐỊNH Ở MÉP DƯỚI BẢN ĐỒ
    // ----------------------------------------------------
    const coordTooltip = document.createElement('div');
    coordTooltip.id = 'mouse-coord-tooltip';
    
    const tooltipPosition = 'absolute';
    const tooltipBottom = '55px';
    const tooltipLeft = '10px';
    const tooltipBg = 'rgba(0, 0, 0, 0.75)';
    const tooltipColor = '#ffffff';
    const tooltipPaddingTopBot = '4px';
    const tooltipPaddingLeftRight = '8px';
    const tooltipFontSize = '12px';
    const tooltipFontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    const tooltipBorderRadius = '4px';
    const tooltipPointerEvents = 'none';
    const tooltipDisplay = 'block';
    const tooltipZIndex = '1000';
    const tooltipWhiteSpace = 'nowrap';

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
    
    coordTooltip.innerHTML = 'Lat: --, Lng: --';
    map.getContainer().appendChild(coordTooltip);

    // ----------------------------------------------------
    // PHẦN 2 & 3: LẮNG NGHE SỰ KIỆN CHUỘT (MOUSEMOVE / MOUSEOUT)
    // ----------------------------------------------------
    map.on('mousemove', function (e) {
        const lng = e.lngLat.lng.toFixed(6);
        const lat = e.lngLat.lat.toFixed(6);
        coordTooltip.innerHTML = `Lat: ${lat}, Lng: ${lng}`;
    });

    map.on('mouseout', function () {
        coordTooltip.innerHTML = 'Lat: --, Lng: --';
    });

    // ----------------------------------------------------
    // PHẦN 4: HỆ THỐNG LƯU TRỮ VÀ KHÔI PHỤC ĐIỂM GHIM (LOCALSTORAGE)
    // ----------------------------------------------------
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

    function getStoredMarkers() {
        if (!isLocalStorageAvailable()) return [];
        const data = localStorage.getItem('pinned_locations');
        try {
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

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

    function removeMarkerFromStorage(markerId) {
        if (!isLocalStorageAvailable()) return;
        let markers = getStoredMarkers();
        markers = markers.filter(m => m.id !== markerId);
        localStorage.setItem('pinned_locations', JSON.stringify(markers));
    }

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

        // Ép style trực tiếp để ghi đè giao diện mặc định bị bóp méo trên mobile
        const popup = new maplibregl.Popup({ 
            offset: 15, 
            closeButton: true,
            maxWidth: '180px' // Chặn không cho mobile tự phóng to khung popup
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

        const removeBtn = popupContent.querySelector(`#remove-btn-${uniqueId}`);
        removeBtn.onclick = function (event) {
            permanentMarker.remove();
            removeMarkerFromStorage(uniqueId);
            event.stopPropagation();
        };

        if (!isRestoring) {
            saveMarkerToStorage({
                id: uniqueId,
                lng: parseFloat(lng),
                lat: parseFloat(lat),
                name: placeName
            });
        }
    }

    function loadSavedMarkers(mapInstance) {
        const storedLocations = getStoredMarkers();
        if (storedLocations.length === 0) return;

        storedLocations.forEach(loc => {
            createPermanentMarker(mapInstance, loc.lng, loc.lat, loc.name, loc.id, true);
        });
    }

    if (map.loaded()) {
        loadSavedMarkers(map);
    } else {
        map.on('load', function () {
            loadSavedMarkers(map);
        });
    }

    // ----------------------------------------------------
    // PHẦN 5: TẠO NÚT BẤM "GHIM ĐIỂM" TRÊN BẢN ĐỒ
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
    // PHẦN 6: SỰ KIỆN CLICK TẠO ĐIỂM GHIM TẠM THỜI
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

        // Cố định maxWidth để ngăn mobile tự động làm giãn to khung popup
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
