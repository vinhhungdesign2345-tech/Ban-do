// js/map.js

// --- KHAI BÁO BIẾN TOÀN CỤC QUẢN LÝ NHÃN SỐ ĐO CẠNH VÀ ID THỬA ĐẤT ---
let activeMarkers = [];         // Mảng lưu trữ các đối tượng Marker hiển thị kích thước cạnh trên bản đồ
window.selectedThuaDatId = null; // Biến toàn cục lưu ID thửa đất đang được chọn

// --- HÀM XÓA SẠCH CÁC NHÃN SỐ ĐO CẠNH TRÊN BẢN ĐỒ ---
function clearLengthMarkers() {
    // Duyệt qua từng marker đang hiển thị và xóa khỏi bản đồ
    activeMarkers.forEach(marker => marker.remove());
    // Làm rỗng mảng sau khi đã xóa hết
    activeMarkers = [];
}

// --- HÀM ĐỊNH DẠNG SỐ CHUẨN VIỆT NAM (Ví dụ: 1.234,5) ---
function formatNumberVN(val) {
    // Kiểm tra nếu giá trị rỗng, null, undefined hoặc dấu gạch ngang thì trả về dấu '-' mặc định
    if (val === null || val === undefined || val === '' || val === '-') return '-';
    
    // Ép kiểu giá trị sang chuỗi và thay thế dấu phẩy (nếu có) thành dấu chấm để chuẩn hóa số thực
    const num = parseFloat(String(val).replace(',', '.'));
    
    // Nếu giá trị sau khi chuyển đổi không phải là số hợp lệ (NaN), trả về nguyên bản giá trị ban đầu
    if (isNaN(num)) return val;

    // Trả về chuỗi số đã được định dạng theo chuẩn địa phương Việt Nam (có dấu chấm phân cách hàng nghìn)
    return num.toLocaleString('vi-VN');
}

// --- HÀM ĐÓNG BẢNG THÔNG TIN VÀ XÓA TRẠNG THÁI LÀM NỔI BẬT (HIGHLIGHT) THỬA ĐẤT ---
function closeParcelPanel() {
    // Lấy phần tử khung hiển thị thông tin thửa đất phía dưới màn hình thông qua ID
    const panel = document.getElementById('parcel-info-panel');
    
    // Nếu khung tồn tại, chuyển trạng thái hiển thị thành 'none' (ẩn đi)
    if (panel) panel.style.display = 'none';

    // Đặt lại ID thửa đất về giá trị null khi đóng panel
    window.selectedThuaDatId = null;

    // 📏 GỌI HÀM XÓA SẠCH CÁC NHÃN KÍCH THƯỚC CẠNH NGAY KHI ĐÓNG PANEL
    clearLengthMarkers();

    // Lấy đối tượng thể hiện bản đồ đang hoạt động được lưu toàn cục trong cửa sổ trình duyệt
    const mapInstance = window.currentMapInstance;
    if (mapInstance) {
        // Kiểm tra xem lớp đồ họa tô màu phần thửa đất được chọn (highlight fill) có tồn tại không
        if (mapInstance.getLayer('sheet-thua-dat-highlight-fill')) {
            // Đặt lại bộ lọc (filter) rỗng để gỡ bỏ hiệu ứng tô màu nổi bật của thửa đất cũ
            mapInstance.setFilter('sheet-thua-dat-highlight-fill', ['==', ['get', 'ID Thửa Đất'], '']);
        }
        
        // Kiểm tra xem lớp đường viền ranh giới thửa đất được chọn (highlight line) có tồn tại không
        if (mapInstance.getLayer('sheet-thua-dat-highlight-line')) {
            // Đặt lại bộ lọc rỗng để gỡ bỏ đường viền nổi bật của thửa đất cũ
            mapInstance.setFilter('sheet-thua-dat-highlight-line', ['==', ['get', 'ID Thửa Đất'], '']);
        }

        // Xóa dữ liệu nguồn vẽ các điểm mốc cạnh trên bản đồ
        if (mapInstance.getSource('parcel-dimensions-source')) {
            mapInstance.getSource('parcel-dimensions-source').setData({
                type: 'FeatureCollection',
                features: [] // Làm trống danh sách các đoạn thẳng kích thước
            });
        }
    }
}

// --- HÀM KHỞI TẠO VÀ CẤU HÌNH TOÀN BỘ BẢN ĐỒ ---
function initMap() {
    // Khởi tạo một đối tượng bản đồ MapLibre mới gắn vào thẻ div có id là 'map'
    const map = new maplibregl.Map({
        container: 'map',                         // ID của thẻ HTML chứa bản đồ
        style: CONFIG.MAP_STYLE,                    // Giao diện/phong cách bản đồ được lấy từ tệp cấu hình chung (config.js)
        center: CONFIG.MAP_CENTER,                    // Tọa độ trung tâm mặc định khi khởi tạo bản đồ
        zoom: CONFIG.MAP_ZOOM                       // Mức độ phóng to (zoom) mặc định ban đầu của bản đồ
    });

    // Lưu trữ tham chiếu đối tượng bản đồ vào biến toàn cục window để các hàm khác có thể gọi lại
    window.currentMapInstance = map;

    // 📍 TÍCH HỢP NÚT ĐỊNH VỊ VỊ TRÍ HIỆN TẠI CỦA NGƯỜI DÙNG
    const geolocate = new maplibregl.GeolocateControl({
        positionOptions: { 
            enableHighAccuracy: true,          // Bật chế độ định vị vệ tinh độ chính xác cao nhất có thể
            maximumAge: 0,                   // Không sử dụng dữ liệu vị trí được lưu trong bộ nhớ đệm cũ
            timeout: 20000                   // Thời gian tối đa chờ phản hồi tín hiệu định vị là 20 giây (20000ms)
        },
        trackUserLocation: true,             // Bật tính năng liên tục theo dõi sự di chuyển của người dùng trên bản đồ
        showUserHeading: true                // Hiển thị mũi tên chỉ hướng hướng quay của thiết bị di động
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

    // 🔄 TÍCH HỢP NÚT CHUYỂN ĐỔI LỚP NỀN BẢN ĐỒ VÀ THANH TRƯỢT ĐỘ MỜ (OPACITY)
    map.on('load', () => {
        const satLayer = 'google-satellite-layer'; // Định danh lớp bản đồ vệ tinh
        const osmLayer = 'osm-layer';                // Định danh lớp bản đồ đường phố OSM

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

        // 🎚️ XỬ LÝ SỰ KIỆN THANH TRƯỢT ĐIỀU CHỈNH ĐỘ MỜ (OPACITY) CÁC THỬA ĐẤT
        const opacitySlider = document.getElementById('opacitySlider');
        const opacityValueLabel = document.getElementById('opacityValue');

        if (opacitySlider) {
            opacitySlider.oninput = function() {
                const val = parseFloat(this.value);
                if (opacityValueLabel) opacityValueLabel.innerText = val;

                // Thay đổi độ mờ phần tô màu thửa đất thông thường (sheet-thua-dat-fill)
                if (map.getLayer('sheet-thua-dat-fill')) {
                    map.setPaintProperty('sheet-thua-dat-fill', 'fill-opacity', val);
                }
                
                // Thay đổi độ mờ phần tô màu thửa đất đang chọn (highlight fill) đậm hơn một chút
                if (map.getLayer('sheet-thua-dat-highlight-fill')) {
                    map.setPaintProperty('sheet-thua-dat-highlight-fill', 'fill-opacity', Math.min(val + 0.2, 1.0));
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
                    'circle-radius': 4,             // Bán kính vòng tròn điểm mốc (pixel)
                    'circle-color': '#ffffff',      // Màu tô bên trong vòng tròn (Trắng)
                    'circle-stroke-width': 1.5,     // Độ dày đường viền vòng tròn (pixel)
                    'circle-stroke-color': '#000000'// Màu đường viền vòng tròn (Đen)
                }
            });
        }

        // Khởi tạo bộ lọc hành chính tỉnh/xã sau khi bản đồ tải hoàn tất
        initFilter(map);
        // Khởi tạo tính năng tìm kiếm thửa đất sau khi bản đồ tải hoàn tất
        initThuaDatSearch(map);
    });

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

            // Trích xuất ID Thửa Đất và gán vào biến toàn cục
            const parcelId = rawProps['ID Thửa Đất'] || rawProps['id'] || '';
            window.selectedThuaDatId = parcelId;

            // Xóa sạch các nhãn số đo cạnh cũ trước khi vẽ nhãn mới cho thửa đất vừa chọn
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

                        // Tạo phần tử div thuần túy hiển thị con số
                        const el = document.createElement('div');
                        el.style.color = '#ffffff';                     // Màu chữ số đo (Trắng)
                        el.style.fontSize = '12px';                     // Cỡ chữ (12 pixel)
                        el.style.fontWeight = 'Bold';                   // Độ đậm của chữ (In đậm)
                        el.style.textShadow = '1px 1px 2px #000000, -1px -1px 2px #000000, 1px -1px 2px #000000, -1px 1px 2px #000000'; // Hiệu ứng viền bóng đen
                        el.style.whiteSpace = 'nowrap';                 // Không cho phép chữ bị ngắt xuống dòng
                        el.innerText = formattedLength;                 // Gán giá trị chiều dài cạnh

                        // Sử dụng maplibregl.Marker để ghim trực tiếp lên bản đồ
                        const marker = new maplibregl.Marker({
                            element: el,
                            anchor: 'center'
                        })
                        .setLngLat(midCoord)           // Thiết lập tọa độ hiển thị là điểm giữa của cạnh
                        .addTo(map);                   // Thêm marker trực tiếp lên bản đồ

                        activeMarkers.push(marker); // Lưu trữ marker vào mảng quản lý chung toàn cục
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

            // Thiết lập bộ lọc để làm nổi bật thửa đất được chọn dựa theo ID Thửa Đất hoặc Tên Chủ
            let selectFilter = parcelId ? ['==', ['get', 'ID Thửa Đất'], rawProps['ID Thửa Đất'] || parcelId] : ['==', ['get', 'Tên Chủ'], tenChu];

            // Áp dụng hiệu ứng làm nổi bật phần tô màu (fill) và đường viền (line) của thửa đất được chọn
            if (map.getLayer('sheet-thua-dat-highlight-fill')) map.setFilter('sheet-thua-dat-highlight-fill', selectFilter);
            if (map.getLayer('sheet-thua-dat-highlight-line')) map.setFilter('sheet-thua-dat-highlight-line', selectFilter);

            // Xây dựng cấu trúc HTML nội dung hiển thị trong bảng thông tin thửa đất (ĐÃ BỎ HOÀN TOÀN PHẦN CẬP NHẬT THỰC ĐỊA)
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
            closeParcelPanel();      // Đóng bảng thông tin thửa đất, gỡ bỏ highlight và tự động xóa nhãn cạnh
            
            // Nếu hàm xử lý chọn Phường/Xã từ tọa độ điểm tồn tại, gọi hàm tra cứu hành chính
            if (typeof selectPhuongFromPoint === 'function') {
                selectPhuongFromPoint(e.lngLat.lng, e.lngLat.lat, map);
            }
        }
        isFeatureClicked = false; // Đặt lại trạng thái cờ kiểm tra click
    });
}

// Kích hoạt thực thi hàm khởi tạo bản đồ ngay sau khi cấu trúc trang HTML được tải hoàn tất
document.addEventListener('DOMContentLoaded', initMap);
