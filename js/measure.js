// ==========================================
// js/measure.js - QUẢN LÝ TÍNH NĂNG ĐO ĐẠC (KHOẢNG CÁCH, CHU VI, DIỆN TÍCH)
// ==========================================

// --- KHAI BÁO BIẾN TOÀN CỤC CHO TÍNH NĂNG ĐO ---
let isMeasuring = false;                       // Trạng thái bật/tắt chế độ đo đạc
let measureCoordinates = [];                   // Mảng lưu trữ danh sách tọa độ các điểm mốc đã click [lng, lat]
let measureMarkers = [];                       // Mảng lưu trữ các nhãn Marker hiển thị số đo cạnh, chu vi, diện tích
let measurePointMarkers = [];                  // Mảng lưu trữ các Marker điểm mốc (có thể kéo thả hoặc click xóa)

// --- QUẢN LÝ LỊCH SỬ UNDO / REDO THÔNG MINH ---
let measureHistory = [];                       // Mảng lưu lịch sử các trạng thái tọa độ trước đó (dùng cho Undo)
let measureRedoStack = [];                     // Mảng lưu lịch sử các trạng thái tọa độ tiếp theo (dùng cho Redo)

// Hàm ghi lại trạng thái hiện tại vào lịch sử trước khi thay đổi
function pushMeasureState() {
    measureHistory.push([...measureCoordinates]);
    measureRedoStack = [];                     // Xóa sạch stack redo mỗi khi có hành động thêm/sửa/xóa điểm mới
}

// ==========================================
// HÀM XÓA SẠCH CÁC NHÃN VÀ ĐIỂM MỐC ĐO ĐẠC TRÊN BẢN ĐỒ
// ==========================================
function clearMeasureMarkers() {
    // Xóa các nhãn hiển thị số đo (cạnh, diện tích, chu vi)
    measureMarkers.forEach(marker => marker.remove());
    measureMarkers = [];
    
    // Xóa các điểm mốc kéo thả (vertex markers)
    measurePointMarkers.forEach(marker => marker.remove());
    measurePointMarkers = [];
}

// ==========================================
// HÀM CẬP NHẬT HÌNH HỌC VÀ NHÃN ĐO ĐẠC TRÊN BẢN ĐỒ
// ==========================================
function updateMeasureGeometry(map, skipRecreateMarkers = false) {
    const features = [];
    
    // 1. Quản lý việc tạo hoặc cập nhật các điểm mốc (Markers)
    if (!skipRecreateMarkers) {
        clearMeasureMarkers();

        measureCoordinates.forEach((coord, index) => {
            // Tạo đối tượng Marker tại mỗi điểm mốc
            const marker = new maplibregl.Marker({
                draggable: true,                     // Cho phép kéo thả điểm mốc để chỉnh sửa hình học
                color: index === 0 ? '#ff0055' : '#3388ff' // Điểm đầu tiên màu hồng đậm, các điểm sau màu xanh dương
            })
            .setLngLat(coord)
            .addTo(map);

            // Sự kiện click vào điểm mốc: Click vào điểm nào thì xóa điểm đó trong chế độ đo
            marker.getElement().addEventListener('click', (e) => {
                e.stopPropagation();
                if (isMeasuring) {
                    pushMeasureState();
                    measureCoordinates.splice(index, 1); // Xóa tọa độ tại vị trí index
                    updateMeasureGeometry(map, false);   // Cập nhật lại hình học bản đồ
                }
            });

            // Sự kiện bắt đầu kéo thả điểm mốc (Drag Start)
            marker.on('dragstart', () => {
                window._isDraggingMarker = true;
                if (map.dragPan) map.dragPan.disable(); // Tạm tắt tính năng trượt bản đồ để dễ kéo điểm
                pushMeasureState();
            });

            // Sự kiện đang kéo thả điểm mốc (Dragging)
            marker.on('drag', () => {
                const lngLat = marker.getLngLat();
                measureCoordinates[index] = [lngLat.lng, lngLat.lat]; // Cập nhật tọa độ mới theo vị trí kéo
                updateMeasureGeometry(map, true);                     // Cập nhật nhanh hình học mà không vẽ lại toàn bộ marker điểm
            });

            // Sự kiện kết thúc kéo thả điểm mốc (Drag End)
            marker.on('dragend', () => {
                window._isDraggingMarker = false;
                if (map.dragPan) map.dragPan.enable();  // Bật lại tính năng trượt bản đồ
                updateMeasureGeometry(map, false);     // Cập nhật lại toàn bộ giao diện nhãn đo
            });

            measurePointMarkers.push(marker);
        });
    } else {
        // Nếu bỏ qua việc tạo lại marker điểm, chỉ dọn dẹp các nhãn số đo cạnh/diện tích cũ
        measureMarkers.forEach(marker => marker.remove());
        measureMarkers = [];
    }

    // Đẩy các điểm mốc vào nguồn dữ liệu GeoJSON dạng Point
    measureCoordinates.forEach(coord => {
        features.push({
            type: 'Feature',
            geometry: { 
                type: 'Point', 
                coordinates: coord 
            },
            properties: {}
        });
    });

    // 2. Xử lý vẽ đường nét (LineString) và vùng phủ (Polygon) khi có từ 2 điểm trở lên
    if (measureCoordinates.length >= 2) {
        let renderCoords = [...measureCoordinates];
        let isClosed = false;

        // Kiểm tra xem đa giác đã được khép kín chưa (điểm cuối trùng điểm đầu)
        if (measureCoordinates.length >= 3) {
            const first = measureCoordinates[0];
            const last = measureCoordinates[measureCoordinates.length - 1];
            if (first[0] === last[0] && first[1] === last[1]) {
                isClosed = true;
            }
        }

        // Thêm Feature dạng đường thẳng (LineString)
        features.push({
            type: 'Feature',
            geometry: { 
                type: 'LineString', 
                coordinates: renderCoords 
            },
            properties: {}
        });

        // Nếu có từ 3 điểm trở lên, tự động tạo vùng phủ (Polygon) để tính diện tích
        if (measureCoordinates.length >= 3) {
            const closedPolygonCoords = [...measureCoordinates];
            const first = closedPolygonCoords[0];
            const last = closedPolygonCoords[closedPolygonCoords.length - 1];
            
            // Tự động khép kín tọa độ đa giác nếu chưa khép kín
            if (first[0] !== last[0] || first[1] !== last[1]) {
                closedPolygonCoords.push(first);
            }
            
            features.push({
                type: 'Feature',
                geometry: { 
                    type: 'Polygon', 
                    coordinates: [closedPolygonCoords] 
                },
                properties: {}
            });
        }

        // 3. Sử dụng thư viện Turf.js để tính toán chiều dài cạnh, chu vi và diện tích
        if (typeof turf !== 'undefined') {
            let segmentsToRender = [];
            let totalPerimeter = 0;
            
            // Duyệt qua từng đoạn thẳng (segment) để tính chiều dài từng cạnh
            for (let i = 0; i < renderCoords.length - 1; i++) {
                const seg = {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [renderCoords[i], renderCoords[i+1]]
                    },
                    properties: {}
                };
                segmentsToRender.push(seg);
                totalPerimeter += turf.length(seg, { units: 'meters' });
            }

            // Nếu là đa giác >= 3 điểm, tính thêm đoạn khép kín từ điểm cuối về điểm đầu
            if (renderCoords.length >= 3) {
                const first = renderCoords[0];
                const last = renderCoords[renderCoords.length - 1];
                if (first[0] !== last[0] || first[1] !== last[1]) {
                    const closingSeg = {
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: [last, first]
                        },
                        properties: {}
                    };
                    segmentsToRender.push(closingSeg);
                    totalPerimeter += turf.length(closingSeg, { units: 'meters' });
                }
            }

            // Hiển thị nhãn số đo chiều dài lên giữa mỗi cạnh
            segmentsToRender.forEach(segment => {
                const segLength = turf.length(segment, { units: 'meters' });
                
                // Quy đổi hiển thị: >= 1000m thì hiển thị dạng km, ngược lại hiển thị mét (m)
                const segText = segLength >= 1000 
                    ? `${(segLength / 1000).toFixed(2)} km` 
                    : `${segLength.toFixed(1)} m`;

                const coords = segment.geometry.coordinates;
                const midCoord = [(coords[0][0] + coords[1][0]) / 2, (coords[0][1] + coords[1][1]) / 2];

                // Cấu hình giao diện HTML cho nhãn số đo cạnh
                const el = document.createElement('div');
                el.style.color = '#ff0055';
                el.style.fontSize = '12px';
                el.style.fontWeight = 'Bold';
                el.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                el.style.padding = '2px 5px';
                el.style.borderRadius = '3px';
                el.style.border = '1px solid #ff0055';
                el.style.whiteSpace = 'nowrap';
                el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
                el.innerText = segText;

                const marker = new maplibregl.Marker({ 
                    element: el, 
                    anchor: 'center' 
                })
                .setLngLat(midCoord)
                .addTo(map);

                measureMarkers.push(marker);
            });

            // Nếu có từ 3 điểm trở lên, tính và hiển thị Diện tích (ở tâm đa giác) và Chu vi (ở điểm cuối)
            if (measureCoordinates.length >= 3) {
                try {
                    const closedCoords = [...measureCoordinates];
                    const first = closedCoords[0];
                    const last = closedCoords[closedCoords.length - 1];
                    if (first[0] !== last[0] || first[1] !== last[1]) {
                        closedCoords.push(first);
                    }

                    const polygon = turf.polygon([closedCoords]);
                    const areaSqm = turf.area(polygon);         // Tính diện tích theo mét vuông (m²)
                    const centroid = turf.centroid(polygon);     // Tìm tâm trọng lực của đa giác để đặt nhãn diện tích
                    const centerCoord = centroid.geometry.coordinates;

                    // Quy đổi diện tích: >= 10000 m² thì hiển thị hécta (ha), ngược lại hiển thị m²
                    const areaText = areaSqm >= 10000 
                        ? `${(areaSqm / 10000).toFixed(2)} ha` 
                        : `${areaSqm.toFixed(1)} m²`;

                    // Cấu hình giao diện nhãn Diện tích
                    const areaEl = document.createElement('div');
                    areaEl.style.color = '#ffffff';
                    areaEl.style.fontSize = '13px';
                    areaEl.style.fontWeight = 'Bold';
                    areaEl.style.backgroundColor = 'rgba(217, 48, 37, 0.9)';
                    areaEl.style.padding = '3px 8px';
                    areaEl.style.borderRadius = '4px';
                    areaEl.style.border = '1px solid #ffffff';
                    areaEl.style.whiteSpace = 'nowrap';
                    areaEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.4)';
                    areaEl.innerText = areaText;

                    const areaMarker = new maplibregl.Marker({ 
                        element: areaEl, 
                        anchor: 'center' 
                    })
                    .setLngLat(centerCoord)
                    .addTo(map);

                    measureMarkers.push(areaMarker);

                    // Cấu hình hiển thị tổng Chu vi
                    const lastPointCoord = measureCoordinates[measureCoordinates.length - 1];
                    const perimeterText = totalPerimeter >= 1000 
                        ? `Chu vi: ${(totalPerimeter / 1000).toFixed(2)} km` 
                        : `Chu vi: ${totalPerimeter.toFixed(1)} m`;

                    const perimEl = document.createElement('div');
                    perimEl.style.color = '#d93025';
                    perimEl.style.fontSize = '12px';
                    perimEl.style.fontWeight = 'Bold';
                    perimEl.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                    perimEl.style.padding = '2px 6px';
                    perimEl.style.borderRadius = '4px';
                    perimEl.style.border = '1px solid #d93025';
                    perimEl.style.whiteSpace = 'nowrap';
                    perimEl.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
                    perimEl.innerText = perimeterText;

                    const perimMarker = new maplibregl.Marker({ 
                        element: perimEl, 
                        anchor: 'bottom-left', 
                        offset: [15, -15] 
                    })
                    .setLngLat(lastPointCoord)
                    .addTo(map);

                    measureMarkers.push(perimMarker);

                } catch (err) {
                    console.error("Lỗi tính toán diện tích/chu vi đo đạc:", err);
                }
            }
        }
    }

    // Cập nhật dữ liệu vào nguồn GeoJSON của bản đồ để hiển thị lớp màu đồ họa (Line & Polygon fill)
    if (map.getSource('measure-source')) {
        map.getSource('measure-source').setData({
            type: 'FeatureCollection',
            features: features
        });
    }
}

// ==========================================
// HÀM HỦY / RESET ĐO ĐẠC
// ==========================================
function resetMeasure(map) {
    isMeasuring = false;
    measureCoordinates = [];
    measureHistory = [];
    measureRedoStack = [];
    clearMeasureMarkers();
    
    // Đưa nút bấm đo đạc về trạng thái mặc định ban đầu
    const measureBtn = document.getElementById('measureDistBtn');
    if (measureBtn) {
        measureBtn.style.backgroundColor = '#ffffff';
        measureBtn.style.color = '#333';
        measureBtn.innerText = '📏 Đo khoảng cách';
    }

    // Đưa con trỏ chuột và dữ liệu bản đồ về trạng thái bình thường
    if (map) {
        map.getCanvas().style.cursor = 'default';
        if (map.getSource('measure-source')) {
            map.getSource('measure-source').setData({ 
                type: 'FeatureCollection', 
                features: [] 
            });
        }
    }
}

// ==========================================
// HÀM KHỞI TẠO TÍNH NĂNG ĐO ĐẠC (ĐƯỢC GỌI KHI MAP LOAD XONG)
// ==========================================
function initMeasureFeature(map) {
    // Thêm nguồn dữ liệu GeoJSON và các layer đồ họa đo đạc lên bản đồ nếu chưa có
    if (!map.getSource('measure-source')) {
        map.addSource('measure-source', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
        });

        // Layer hiển thị vùng phủ màu hồng khi vẽ đa giác (Polygon)
        map.addLayer({
            id: 'measure-polygon-fill',
            type: 'fill',
            source: 'measure-source',
            filter: ['==', '$type', 'Polygon'],
            paint: {
                'fill-color': '#ff0055',
                'fill-opacity': 0.2
            }
        });

        // Layer hiển thị đường viền nét đứt màu hồng
        map.addLayer({
            id: 'measure-lines',
            type: 'line',
            source: 'measure-source',
            filter: ['in', '$type', 'LineString', 'Polygon'],
            paint: {
                'line-color': '#ff0055',
                'line-width': 3,
                'line-dasharray': [2, 2]
            }
        });
    }

    // Gán sự kiện click cho nút bấm Đo khoảng cách / Hủy đo
    const measureBtn = document.getElementById('measureDistBtn');
    if (measureBtn) {
        measureBtn.onclick = function() {
            isMeasuring = !isMeasuring; // Đảo trạng thái bật/tắt
            if (isMeasuring) {
                this.style.backgroundColor = '#e0e0e0';
                this.style.color = '#d93025';
                this.innerText = '🛑 Hủy đo';       // Chuyển chữ thành Hủy đo khi kích hoạt
                map.getCanvas().style.cursor = 'crosshair'; // Đổi con trỏ chuột thành dấu cộng
                if (typeof closeParcelPanel === 'function') closeParcelPanel();
            } else {
                resetMeasure(map); // Gọi hàm hủy và dọn dẹp khi bấm tắt
            }
        };
    }

    // Lắng nghe sự kiện bàn phím hỗ trợ phím tắt Undo (Ctrl+Z) và Redo (Ctrl+Y / Ctrl+Shift+Z)
    window.addEventListener('keydown', (e) => {
        if (!isMeasuring) return;

        const isCtrlOrMeta = e.ctrlKey || e.metaKey;
        const keyLower = e.key.toLowerCase();

        // Tổ hợp phím Redo: Ctrl+Y hoặc Ctrl+Shift+Z
        if (isCtrlOrMeta && ((e.shiftKey && keyLower === 'z') || keyLower === 'y')) {
            e.preventDefault();
            if (measureRedoStack.length > 0) {
                measureHistory.push([...measureCoordinates]);
                measureCoordinates = measureRedoStack.pop();
                updateMeasureGeometry(map, false);
            }
        } 
        // Tổ hợp phím Undo: Ctrl+Z
        else if (isCtrlOrMeta && keyLower === 'z') {
            e.preventDefault();
            if (measureHistory.length > 0) {
                measureRedoStack.push([...measureCoordinates]);
                measureCoordinates = measureHistory.pop();
                updateMeasureGeometry(map, false);
            }
        }
    });
}
