// ==========================================
// gps.js - HỆ THỐNG HIỂN THỊ TỌA ĐỘ CỐ ĐỊNH MÉP DƯỚI VÀ GHIM ĐIỂM (MAPLIBRE GL)
// ==========================================

function initGPSControl(map) {
    
    // ----------------------------------------------------
    // PHẦN 1: TẠO HỘP CÔNG CỤ HIỂN THỊ TỌA ĐỘ CỐ ĐỊNH Ở MÉP DƯỚI BẢN ĐỒ
    // ----------------------------------------------------
    const coordTooltip = document.createElement('div');
    coordTooltip.id = 'mouse-coord-tooltip';
    
    coordTooltip.style.cssText = `
        position: absolute;
        bottom: 55px;
        left: 10px;
        background: rgba(0, 0, 0, 0.75);
        color: #ffffff;
        padding: 4px 8px;
        font-size: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        border-radius: 4px;
        pointer-events: none;
        display: block;
        z-index: 1000;
        white-space: nowrap;
    `;
    
    coordTooltip.innerHTML = 'Lat: --, Lng: --';
    map.getContainer().appendChild(coordTooltip);

    map.on('mousemove', function (e) {
        const lng = e.lngLat.lng.toFixed(6);
        const lat = e.lngLat.lat.toFixed(6);
        coordTooltip.innerHTML = `Lat: ${lat}, Lng: ${lng}`;
    });

    map.on('mouseout', function () {
        coordTooltip.innerHTML = 'Lat: --, Lng: --';
    });

    // ----------------------------------------------------
    // PHẦN 2: HỆ THỐNG LƯU TRỮ VÀ KHÔI PHỤC ĐIỂM GHIM (LOCALSTORAGE)
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

    // Hàm tạo nội dung HTML bên trong popup
    function createPopupHTML(placeName, lat, lng, uniqueId, isPermanent = false) {
        const container = document.createElement('div');
        container.style.cssText = `
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            width: 140px;
            padding: 0px;
            margin: 0px;
            box-sizing: border-box;
        `;

        container.innerHTML = `
            <input type="text" id="input-${uniqueId}" value="${placeName}" ${isPermanent ? 'disabled' : ''} placeholder="Tên địa điểm..." style="
                width: 100%; 
                padding: 3px 6px; 
                font-size: 12px; 
                border: 1px solid #ccc; 
                border-radius: 3px; 
                box-sizing: border-box; 
                margin-bottom: 4px; 
                background: ${isPermanent ? '#f1f3f4' : '#fff'};
                outline: none;
            " />
            
            <div style="
                font-size: 11px; 
                color: #555; 
                margin-bottom: 6px; 
                font-family: monospace;
                text-align: center;
                box-sizing: border-box;
            ">
                ${lat}, ${lng}
            </div>
            
            <button id="btn-${uniqueId}" style="
                width: 100%; 
                padding: 4px 6px; 
                background: ${isPermanent ? '#d93025' : '#1a73e8'}; 
                color: #fff; 
                border: none; 
                border-radius: 3px; 
                cursor: pointer; 
                font-weight: 500; 
                font-size: 11px;
                box-sizing: border-box;
            ">
                ${isPermanent ? 'Bỏ đánh dấu' : 'Đánh dấu'}
            </button>
        `;
        return container;
    }

    // Hàm áp dụng style chuẩn ép sát khung popup của MapLibre (Khắc phục lỗi phình to trên mobile)
    function applyPopupFix(popupInstance) {
        const popupElement = popupInstance.getElement();
        if (popupElement) {
            const contentEl = popupElement.querySelector('.maplibregl-popup-content');
            if (contentEl) {
                contentEl.style.cssText = `
                    padding: 8px !important;
                    border-radius: 6px !important;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
                    width: 150px !important;
                    box-sizing: border-box !important;
                `;
            }
        }
    }

    function createPermanentMarker(mapInstance, lng, lat, placeName, markerId = null, isRestoring = false) {
        const uniqueId = markerId || 'marker_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        const popupContent = createPopupHTML(placeName, lat, lng, uniqueId, true);

        const popup = new maplibregl.Popup({ 
            offset: 15, 
            closeButton: true,
            maxWidth: '160px' 
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

        // Ép style ngay sau khi popup mở
        popup.on('open', () => {
            applyPopupFix(popup);
        });

        const removeBtn = popupContent.querySelector(`#btn-${uniqueId}`);
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
    // PHẦN 3: NÚT BẬT/TẮT CHẾ ĐỘ GHIM
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
            
            pinButton.style.cssText = `
                width: 29px;
                height: 29px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 15px;
                border: none;
                background: transparent;
                cursor: pointer;
                outline: none;
                padding: 0;
            `;
            
            pinButton.onclick = () => {
                isPinModeActive = !isPinModeActive;
                if (isPinModeActive) {
                    // Tô xanh toàn bộ cả nút bấm lẫn khung bao ngoài để không bị lộ nền trắng
                    pinButton.style.background = '#6a9ceb';
                    this._container.style.background = '#6a9ceb';
                } else {
                    pinButton.style.background = 'transparent';
                    this._container.style.background = ''; // Trả về màu mặc định của bản đồ
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

    // ----------------------------------------------------
    // PHẦN 4: SỰ KIỆN CLICK BẢN ĐỒ TẠO ĐIỂM GHIM TẠM THỜI
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
        const uniqueTempId = 'temp_' + Date.now();

        const popupContent = createPopupHTML('Địa điểm mới', clickedLat, clickedLng, uniqueTempId, false);

        const popup = new maplibregl.Popup({ 
            offset: 15, 
            closeButton: true,
            maxWidth: '160px' 
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

        tempMarker = new maplibregl.Marker({ element: markerEl })
            .setLngLat([e.lngLat.lng, e.lngLat.lat])
            .setPopup(popup)
            .addTo(map);

        // Ép style ngay sau khi popup mở
        popup.on('open', () => {
            applyPopupFix(popup);
        });

        const actionBtn = popupContent.querySelector(`#btn-${uniqueTempId}`);
        const nameInput = popupContent.querySelector(`#input-${uniqueTempId}`);

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
