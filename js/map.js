// --- HÀM KHỞI TẠO VÀ CẤU HÌNH TOÀN BỘ BẢN ĐỒ ---
function initMap() {
    // Khởi tạo một đối tượng bản đồ MapLibre mới gắn vào thẻ div có id là 'map'
    const map = new maplibregl.Map({
        container: 'map',                         // ID của thẻ HTML chứa bản đồ
        style: CONFIG.MAP_STYLE,                  // Giao diện/phong cách bản đồ được lấy từ tệp cấu hình chung (config.js)
        center: CONFIG.MAP_CENTER,                // Tọa độ trung tâm mặc định khi khởi tạo bản đồ
        zoom: CONFIG.MAP_ZOOM                     // Mức độ phóng to (zoom) mặc định ban đầu của bản đồ
    });

    // Lưu trữ tham chiếu đối tượng bản đồ vào biến toàn cục window để các hàm khác có thể gọi lại
    window.currentMapInstance = map;

    // 📍 TÍCH HỢP NÚT ĐỊNH VỊ VỊ TRÍ HIỆN TẠI CỦA NGƯỜI DÙNG
    const geolocate = new maplibregl.GeolocateControl({
        positionOptions: { 
            enableHighAccuracy: true,       // Bật chế độ định vị vệ tinh độ chính xác cao nhất có thể
            maximumAge: 0,                  // Không sử dụng dữ liệu vị trí được lưu trong bộ nhớ đệm cũ
            timeout: 20000                  // Thời gian tối đa chờ phản hồi tín hiệu định vị là 20 giây (20000ms)
        },
        trackUserLocation: true,            // Bật tính năng liên tục theo dõi sự di chuyển của người dùng trên bản đồ
        showUserHeading: true               // Hiển thị mũi tên chỉ hướng hướng quay của thiết bị di động
    });
    
    // Thêm điều khiển định vị vào góc trên bên phải của bản đồ
    map.addControl(geolocate, 'top-right');

    // Lắng nghe sự kiện khi hệ thống đã xác định thành công vị trí của người dùng
    geolocate.on('geolocate', async (position) => {
        const lng = position.coords.longitude; // Lấy kinh độ từ kết quả định vị
        const lat = position.coords.latitude;  // Lấy vĩ độ từ kết quả định vị
        
        // Nếu hàm xử lý chọn Phường/Xã từ tọa độ điểm tồn tại, gọi hàm để tự động tra cứu không gian
        if (typeof selectPhuongFromPoint === 'function') {
            await selectPhuongFromPoint(lng, lat, map);
        }
    });

    // 🔄 TÍCH HỢP NÚT CHUYỂN ĐỔI LỚP NỀN BẢN ĐỒ (VỆ TINH GOOGLE <-> ĐƯỜNG PHỐ OSM)
    map.on('load', () => {
        const satLayer = 'google-satellite-layer'; // Định danh lớp bản đồ vệ tinh
        const osmLayer = 'osm-layer';               // Định danh lớp bản đồ đường phố OSM

        // Ép trạng thái hiển thị chuẩn xác ngay khi bản đồ vừa load xong
        map.setLayoutProperty(satLayer, 'visibility', 'visible');
        map.setLayoutProperty(osmLayer, 'visibility', 'none');

        const toggleBtn = document.getElementById('toggleLayerBtn');
        if (toggleBtn) {
            // Đồng bộ nhãn nút bấm ban đầu khớp với trạng thái hiển thị
            toggleBtn.innerText = 'Chuyển sang Bản đồ OSM';

            // Lắng nghe hành động nhấn chuột vào nút chuyển đổi lớp bản đồ nền
            toggleBtn.onclick = function() {
                // Kiểm tra xem lớp vệ tinh có đang hiển thị không
                const isSatVisible = map.getLayoutProperty(satLayer, 'visibility') === 'visible';
                
                if (isSatVisible) {
                    // Nếu đang là vệ tinh -> ẩn lớp vệ tinh đi
                    map.setLayoutProperty(satLayer, 'visibility', 'none');
                    // Hiển thị lớp đường phố OSM lên
                    map.setLayoutProperty(osmLayer, 'visibility', 'visible');
                    // Đổi nhãn chữ trên nút thành gợi ý chuyển ngược lại sang vệ tinh
                    this.innerText = 'Chuyển sang Bản đồ Vệ tinh';
                } else {
                    // Nếu đang là đường phố -> ẩn lớp đường phố đi
                    map.setLayoutProperty(satLayer, 'visibility', 'visible');
                    // Hiển thị lớp bản đồ vệ tinh lên
                    map.setLayoutProperty(osmLayer, 'visibility', 'none');
                    // Đổi nhãn chữ trên nút thành chuẩn "Chuyển sang Bản đồ OSM"
                    this.innerText = 'Chuyển sang Bản đồ OSM';
                }
            };
        }

        // 📏 KHỞI TẠO NGUỒN VÀ LỚP HIỂN THỊ ĐỘ DÀI CÁC CẠNH THỬA ĐẤT 
        if (!map.getSource('parcel-dimensions-source')) {
            // Tạo nguồn dữ liệu GeoJSON chứa các cạnh thửa đất
            map.addSource('parcel-dimensions-source', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });

            // Sử dụng lớp vòng tròn (circle) đánh dấu điểm giữa mỗi cạnh thửa đất
            map.addLayer({
                id: 'parcel-dimensions-layer',
                type: 'circle',
                source: 'parcel-dimensions-source',
                paint: {
                    'circle-radius': 4,             // Bán kính vòng tròn điểm mốc nhỏ gọn (pixel)
                    'circle-color': '#ffffff',      // Màu tô bên trong vòng tròn (Trắng)
                    'circle-stroke-width': 1.5,     // Độ dày đường viền vòng tròn (pixel)
                    'circle-stroke-color': '#000000'// Màu viền vòng tròn (Đen)
                }
            });
        }

        // Khởi tạo bộ lọc hành chính tỉnh/xã sau khi bản đồ tải hoàn tất
        initFilter(map);
        // Khởi tạo tính năng tìm kiếm thửa đất sau khi bản đồ tải hoàn tất
        initThuaDatSearch(map);
    });

    // 🏷️ Mảng lưu trữ các Marker hiển thị số đo độ dài cạnh trên bản đồ (thay thế cho Popup cũ để bỏ hẳn nền trắng)
    let activeMarkers = [];

    // Hàm dọn dẹp và xóa các Marker hiển thị số đo cũ
    function clearLengthMarkers() {
        activeMarkers.forEach(marker => marker.remove()); // Xóa từng Marker khỏi bản đồ
        activeMarkers = []; // Làm rỗng mảng lưu trữ
    }

    // Khai báo danh sách các lớp thuộc tính thửa đất từ Google Sheets cần bắt sự kiện click
    const sheetLayers = ['sheet-thua-dat-fill', 'sheet-thua-dat-line'];
    let isFeatureClicked = false; // Biến cờ kiểm tra xem có thửa đất nào vừa được click hay chưa

    // Lặp qua từng lớp bản đồ thửa đất để gán sự kiện tương tác
    sheetLayers.forEach(layerId => {
        // Lắng nghe sự kiện click chuột vào một thửa đất trên lớp chỉ định
        map.on('click', layerId, (e) => {
            if (!e.features || !e.features.length) return;
            isFeatureClicked = true; // Đánh dấu là đã click trúng thửa đất

            const selectedFeature = e.features[0];       // Lấy thửa đất đầu tiên trong danh sách các đối tượng bị click
            const rawProps = selectedFeature.properties || {}; // Lấy toàn bộ tập dữ liệu thuộc tính đi kèm của thửa đất

            // Xóa các nhãn số đo cạnh cũ nếu có trước khi vẽ mới
            clearLengthMarkers();

            // 📏 TÍCH HỢP TURF.JS TÍNH TOÁN VÀ HIỂN THỊ ĐỘ DÀI MỖI CẠNH CỦA THỬA ĐẤT
            if (typeof turf !== 'undefined' && selectedFeature.geometry) {
                try {
                    // Tách hình học thửa đất thành các đoạn thẳng riêng biệt (line segments)
                    const lineSegments = turf.lineSegment(selectedFeature);
                    const dimensionFeatures = [];

                    // Duyệt qua từng đoạn thẳng cạnh của thửa đất
                    lineSegments.features.forEach(segment => {
                        // Tính chiều dài cạnh theo đơn vị mét
                        const lengthMeters = turf.length(segment, { units: 'meters' });
                        
                        // Định dạng hiển thị: Nếu dài >= 10m thì lấy 1 chữ số thập phân, nhỏ hơn thì lấy 2 chữ số
                        const formattedLength = lengthMeters >= 10 
                            ? `${lengthMeters.toFixed(1)}m` 
                            : `${lengthMeters.toFixed(2)}m`;

                        segment.properties.length = formattedLength;
                        dimensionFeatures.push(segment);

                        // Tính tọa độ điểm giữa (midpoint) của cạnh để ghim số đo trực tiếp lên đó
                        const coords = segment.geometry.coordinates;
                        const midCoord = [(coords[0][0] + coords[1][0]) / 2, (coords[0][1] + coords[1][1]) / 2];

                        // Tạo phần tử HTML thuần túy chỉ có chữ màu trắng và bóng đổ viền đen (hoàn toàn không có khung nền trắng)
                        const el = document.createElement('div');
                        el.style.color = '#ffffff';                     // Màu chữ số đo (Trắng)
                        el.style.fontSize = '12px';                     // Cỡ chữ (12 pixel)
                        el.style.fontWeight = 'bold';                   // Độ đậm của chữ (In đậm)
                        // Hiệu ứng bóng đổ viền đen xung quanh chữ giúp hiển thị cực rõ trên nền ảnh vệ tinh sáng/tối khác nhau
                        el.style.textShadow = '1px 1px 2px #000000, -1px -1px 2px #000000, 1px -1px 2px #000000, -1px 1px 2px #000000';
                        el.style.whiteSpace = 'nowrap';                 // Không cho phép chữ bị ngắt xuống dòng
                        el.innerText = formattedLength;                 // Gán giá trị chiều dài cạnh (ví dụ: 30.4m)

                        // Sử dụng maplibregl.Marker thay cho Popup để loại bỏ triệt để khung nền trắng mặc định
                        const marker = new maplibregl.Marker({
                            element: el,
                            anchor: 'center'
                        })
                        .setLngLat(midCoord)        // Thiết lập tọa độ hiển thị tại điểm giữa của cạnh
                        .addTo(map);                // Thêm trực tiếp lên bản đồ

                        activeMarkers.push(marker); // Lưu trữ marker vào mảng quản lý chung
                    });

                    // Cập nhật dữ liệu vào nguồn bản đồ để vẽ các điểm mốc
                    if (map.getSource('parcel-dimensions-source')) {
                        map.getSource('parcel-dimensions-source').setData({
                            type: 'FeatureCollection',
                            features: dimensionFeatures
                        });
                    }
                } catch (err) {
                    console.error("Lỗi trong quá trình tính toán độ dài cạnh thửa đất:", err);
                }
            }

            // Trích xuất các trường thông tin chi tiết của thửa đất để hiển thị lên bảng thông tin
            const soTo = rawProps['Số tờ'] || rawProps['So to'] || '-';
            const soThua = rawProps['Số thửa'] || rawProps['So thua'] || '-';
            const rawDienTich = rawProps['Diện tích'] || rawProps['Dien tich'] || '-';
            const dienTich = formatNumberVN(rawDienTich); // Định dạng diện tích theo chuẩn Việt Nam
            const loaiDat = rawProps['Loại Đất'] || rawProps['Loại Đất:'] || rawProps['Loại đất'] || rawProps['loai_dat'] || '-';
            const tenChu = rawProps['Tên Chủ'] || rawProps['Tên chủ'] || '-';
            const soDinhDanh = rawProps['Số định danh chủ đất'] || rawProps['Số định danh'] || 'Không có';
            const ghiChu = rawProps['Ghi Chú'] || rawProps['Ghi chú'] || 'Không có';
            const parcelId = rawProps['ID Thửa Đất'] || rawProps['id'];

            // Thiết lập bộ lọc để làm nổi bật thửa đất được chọn dựa theo ID Thửa Đất hoặc Tên Chủ
            let selectFilter = parcelId ? ['==', ['get', 'ID Thửa Đất'], rawProps['ID Thửa Đất'] || parcelId] : ['==', ['get', 'Tên Chủ'], tenChu];

            // Áp dụng hiệu ứng làm nổi bật phần tô màu (fill) và đường viền (line) của thửa đất được chọn
            if (map.getLayer('sheet-thua-dat-highlight-fill')) map.setFilter('sheet-thua-dat-highlight-fill', selectFilter);
            if (map.getLayer('sheet-thua-dat-highlight-line')) map.setFilter('sheet-thua-dat-highlight-line', selectFilter);

            // Xây dựng cấu trúc HTML nội dung hiển thị trong bảng thông tin thửa đất phía dưới màn hình
            const panelContent = `
                <div><b>Số tờ:</b> ${soTo}</div>
                <div><b>Số thửa:</b> ${soThua}</div>
                <div><b>Diện tích:</b> ${dienTich} m²</div>
                <div><b>Loại đất:</b> ${loaiDat}</div>
                <div style="grid-column: span 2;"><b>Tên chủ:</b> ${tenChu}</div>
                <div><b>Số định danh:</b> ${soDinhDanh}</div>
                <div><b>Ghi chú:</b> ${ghiChu}</div>
            `;

            // Đưa nội dung thông tin vào khung giao diện tương ứng trên HTML
            const panelContentEl = document.getElementById('panel-content');
            const panelEl = document.getElementById('parcel-info-panel');
            if (panelContentEl) panelContentEl.innerHTML = panelContent;
            if (panelEl) panelEl.style.display = 'block'; // Hiển thị bảng thông tin lên màn hình
        });

        // Thay đổi con trỏ chuột thành dạng mặc định khi rê chuột vào hoặc ra khỏi thửa đất
        map.on('mouseenter', layerId, () => map.getCanvas().style.cursor = 'default');
        map.on('mouseleave', layerId, () => map.getCanvas().style.cursor = 'default');
    });

    // Lắng nghe sự kiện click trực tiếp lên vùng trống của nền bản đồ (ngoài các thửa đất)
    map.on('click', (e) => {
        if (!isFeatureClicked) {
            closeParcelPanel();     // Đóng bảng thông tin thửa đất và gỡ bỏ highlight
            clearLengthMarkers();   // Xóa sạch nhãn số đo cạnh khi click ra ngoài
            
            // Nếu hàm xử lý chọn Phường/Xã từ tọa độ điểm tồn tại, gọi hàm tra cứu hành chính
            if (typeof selectPhuongFromPoint === 'function') {
                selectPhuongFromPoint(e.lngLat.lng, e.lngLat.lat, map);
            }
        }
        isFeatureClicked = false; // Đặt lại trạng thái cờ kiểm tra click
    });
}
