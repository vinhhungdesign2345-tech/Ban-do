// ==========================================
// FILE: js/map.js (Toàn bộ code chuẩn tích hợp hiển thị nhãn tên tỉnh)
// ==========================================

// Định dạng số chuẩn Việt Nam: 1.234,5 (Ví dụ diện tích, số lượng lớn)
function formatNumberVN(val) {
    // Trả về dấu gạch ngang nếu giá trị bị trống, null hoặc undefined
    if (val === null || val === undefined || val === '' || val === '-') return '-';
    
    // Đổi dấu phẩy thành dấu chấm để hàm toán học đọc được số thập phân
    const num = parseFloat(String(val).replace(',', '.'));
    // Nếu không phải là số hợp lệ thì trả về nguyên bản giá trị gốc
    if (isNaN(num)) return val;

    // Trả về chuỗi định dạng số theo chuẩn văn hóa Việt Nam (dấu chấm ngăn cách hàng nghìn)
    return num.toLocaleString('vi-VN');
}

// Hàm đóng bảng thông tin phía dưới màn hình và xóa trạng thái làm nổi bật (highlight) thửa đất
function closeParcelPanel() {
    const panel = document.getElementById('parcel-info-panel');
    if (panel) panel.style.display = 'none'; // Ẩn khung giao diện bảng thông tin đi

    const mapInstance = window.currentMapInstance;
    if (mapInstance) {
        // Đặt lại bộ lọc của lớp phủ màu nền về rỗng để tắt hiệu ứng chọn thửa đất
        if (mapInstance.getLayer('sheet-thua-dat-highlight-fill')) {
            mapInstance.setFilter('sheet-thua-dat-highlight-fill', ['==', ['get', 'ID Thửa Đất'], '']);
        }
        // Đặt lại bộ lọc của lớp đường viền về rỗng
        if (mapInstance.getLayer('sheet-thua-dat-highlight-line')) {
            mapInstance.setFilter('sheet-thua-dat-highlight-line', ['==', ['get', 'ID Thửa Đất'], '']);
        }
    }
}

// Hàm xử lý riêng khi chọn Việt Nam (Di chuyển camera ra góc nhìn toàn quốc)
function zoomToVietNam(map) {
    map.flyTo({
        center: [106.5, 16.0], // Tọa độ trung tâm địa lý của Việt Nam (Kinh độ, Vĩ độ)
        zoom: 5.5,             // Mức độ thu phóng (zoom level) vừa khít để thấy toàn bộ cả nước
        essential: true        // Đảm bảo lệnh chuyển động camera luôn được thực thi mượt mà
    });
}

function initMap() {
    // Khởi tạo đối tượng bản đồ MapLibre GL và gắn vào thẻ div có id là 'map' trong file HTML
    const map = new maplibregl.Map({
        container: 'map',           // ID của thẻ HTML chứa bản đồ
        style: CONFIG.MAP_STYLE,    // Lấy cấu hình giao diện nền bản đồ từ file config.js
        center: CONFIG.MAP_CENTER,  // Tọa độ điểm trung tâm mặc định khi khởi động
        zoom: CONFIG.MAP_ZOOM       // Mức zoom mặc định khi khởi động
    });

    // Lưu trữ instance của bản đồ ra biến toàn cục window để các tệp script bên ngoài có thể gọi lại
    window.currentMapInstance = map;

    // 📍 TÍCH HỢP NÚT ĐỊNH VỊ VỚI CẤU HÌNH GPS PHẦN CỨNG THỰC TẾ
    const geolocate = new maplibregl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true, // Bật chế độ định vị có độ chính xác cao (GPS phần cứng)
            maximumAge: 0,            // Không sử dụng dữ liệu định vị cũ trong bộ nhớ đệm
            timeout: 20000            // Thời gian tối đa (20 giây) chờ bắt tín hiệu vệ tinh
        },
        trackUserLocation: true,      // Liên tục theo dõi vị trí thực tế của thiết bị
        showUserHeading: true         // Hiển thị hướng xoay/hướng di chuyển của người dùng trên bản đồ
    });

    // Thêm nút định vị vào góc trên bên phải của bản đồ
    map.addControl(geolocate, 'top-right');

    // Lắng nghe sự kiện khi thiết bị trả về tọa độ GPS thành công
    geolocate.on('geolocate', async (position) => {
        const lng = position.coords.longitude; // Lấy kinh độ thực tế
        const lat = position.coords.latitude;  // Lấy vĩ độ thực tế
        
        console.log("Vị trí GPS hiện tại:", lng, lat);

        // Tự động gọi hàm quét tọa độ để nhận diện Tỉnh, Phường/Xã và lọc thửa đất tương ứng
        if (typeof selectPhuongFromPoint === 'function') {
            await selectPhuongFromPoint(lng, lat, map);
        }
    });

    // Sự kiện kích hoạt khi bản đồ đã tải xong hoàn toàn cấu trúc dữ liệu nền
    map.on('load', () => {
        // Kiểm tra xem nguồn dữ liệu ranh giới Việt Nam đã được thêm vào bản đồ chưa
        if (!map.getSource('vietnam-boundary-source')) {
            
            // 1. Khai báo nguồn dữ liệu GeoJSON chứa ranh giới toàn quốc
            map.addSource('vietnam-boundary-source', {
                type: 'geojson',
                data: './geojson/Viet-Nam.json' // Đường dẫn tới file chứa ranh giới các tỉnh
            });

            // 2. Thêm lớp hiển thị đường viền ranh giới các tỉnh (Line Layer)
            map.addLayer({
                id: 'vietnam-boundary-layer',
                type: 'line',
                source: 'vietnam-boundary-source',
                paint: {
                    'line-color': '#007cbf',    // Màu sắc của đường viền ranh giới (Xanh dương)
                    'line-width': 1.5,          // Độ dày của đường viền
                    'line-opacity': 0.8         // Độ trong suốt của đường viền
                }
            });

            // 3. Thêm lớp hiển thị tên của từng tỉnh thành (Symbol Layer)
            map.addLayer({
                id: 'vietnam-province-labels',
                type: 'symbol',
                source: 'vietnam-boundary-source',
                minzoom: 4,   // Mức zoom nhỏ nhất bắt đầu hiển thị tên tỉnh (khi ở góc nhìn toàn quốc)
                maxzoom: 11,  // Mức zoom lớn nhất; khi bạn phóng to >= 11, tên tỉnh sẽ tự động ẩn đi để không che khuất thửa đất
                layout: {
                    // Lấy giá trị tên tỉnh từ thuộc tính 'name' trong file JSON (hãy đổi thành 'ten_tinh' nếu file của bạn dùng tên khác)
                    'text-field': ['get', 'name'], 
                    'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'], // Phông chữ hiển thị nhãn
                    'text-size': 12,        // Kích thước chữ của tên tỉnh
                    'text-anchor': 'center' // Cố định vị trí neo chữ ở tâm vùng ranh giới
                },
                paint: {
                    'text-color': '#333333',       // Màu sắc của chữ (Màu xám đậm)
                    'text-halo-color': '#ffffff',  // Màu viền bao quanh chữ giúp nổi bật trên nền bản đồ
                    'text-halo-width': 1.5         // Độ dày của viền bao quanh chữ
                }
            });
        }

        initFilter(map);        // Khởi tạo tính năng bộ lọc lựa chọn Tỉnh / Phường / Xã
        initThuaDatSearch(map); // Khởi tạo tính năng tìm kiếm thông tin thửa đất

        // 🔗 LẮNG NGHE SỰ KIỆN THAY ĐỔI TỪ DROPDOWN CHỌN TỈNH HOẶC CHỌN VIỆT NAM
        const provinceSelect = document.getElementById('province-select') || document.getElementById('tinh-select');
        if (provinceSelect) {
            provinceSelect.addEventListener('change', (e) => {
                const selectedValue = e.target.value;
                // Nếu người dùng chọn mục Việt Nam thì gọi hàm zoom toàn quốc
                if (selectedValue === "VietNam" || selectedValue.toLowerCase().includes("việt nam")) {
                    zoomToVietNam(map);
                }
            });
        }
    });

    // Mảng chứa định danh của các lớp đồ họa thửa đất chi tiết (lớp tô màu và lớp đường viền)
    const sheetLayers = ['sheet-thua-dat-fill', 'sheet-thua-dat-line'];
    let isFeatureClicked = false; // Biến cờ kiểm tra xem người dùng có bấm trúng thửa đất hay không

    // Lặp qua từng lớp để gán sự kiện bấm chuột (click)
    sheetLayers.forEach(layerId => {
        map.on('click', layerId, (e) => {
            if (!e.features || !e.features.length) return; // Dừng lại nếu không bắt được dữ liệu đối tượng

            isFeatureClicked = true; // Xác nhận người dùng đã bấm trúng thửa đất

            const selectedFeature = e.features[0];         // Lấy thửa đất đầu tiên nằm ở vị trí click
            const rawProps = selectedFeature.properties || {}; // Lấy toàn bộ thông tin chi tiết của thửa đất

            // Lọc và trích xuất các thông tin cụ thể (hỗ trợ cả chữ hoa và chữ thường để tránh lệch dữ liệu)
            const soTo = rawProps['Số tờ'] || rawProps['So to'] || '-';
            const soThua = rawProps['Số thửa'] || rawProps['So thua'] || '-';
            
            const rawDienTich = rawProps['Diện tích'] || rawProps['Dien tich'] || '-';
            const dienTich = formatNumberVN(rawDienTich); // Gọi hàm chuẩn hóa số diện tích kiểu Việt Nam

            const loaiDat = rawProps['Loại Đất'] || rawProps['Loại Đất:'] || rawProps['Loại đất'] || rawProps['loai_dat'] || '-';
            const tenChu = rawProps['Tên Chủ'] || rawProps['Tên chủ'] || '-';
            const soDinhDanh = rawProps['Số định danh chủ đất'] || rawProps['Số định danh'] || 'Không có';
            const ghiChu = rawProps['Ghi Chú'] || rawProps['Ghi chú'] || 'Không có';

            const parcelId = rawProps['ID Thửa Đất'] || rawProps['id'];

            // Xây dựng câu lệnh điều kiện lọc để tô màu làm nổi bật (highlight) đúng thửa đất vừa chọn
            let selectFilter;
            if (parcelId) {
                selectFilter = ['==', ['get', 'ID Thửa Đất'], rawProps['ID Thửa Đất'] || parcelId];
            } else {
                selectFilter = ['==', ['get', 'Tên Chủ'], rawProps['Tên Chủ'] || tenChu];
            }

            // Áp dụng bộ lọc highlight cho lớp tô nền bên trong thửa đất
            if (map.getLayer('sheet-thua-dat-highlight-fill')) {
                map.setFilter('sheet-thua-dat-highlight-fill', selectFilter);
            }
            // Áp dụng bộ lọc highlight cho lớp đường viền ranh giới thửa đất
            if (map.getLayer('sheet-thua-dat-highlight-line')) {
                map.setFilter('sheet-thua-dat-highlight-line', selectFilter);
            }

            // Cấu trúc nội dung mã HTML sẽ hiển thị lên bảng thông tin chi tiết ở góc dưới màn hình
            const panelContent = `
                <div><b>Số tờ:</b> ${soTo}</div>
                <div><b>Số thửa:</b> ${soThua}</div>
                <div><b>Diện tích:</b> ${dienTich} m²</div>
                <div><b>Loại đất:</b> ${loaiDat}</div>
                <div style="grid-column: span 2;"><b>Tên chủ:</b> ${tenChu}</div>
                <div><b>Số định danh:</b> ${soDinhDanh}</div>
                <div><b>Ghi chú:</b> ${ghiChu}</div>
            `;

            const panelContentEl = document.getElementById('panel-content');
            const panelEl = document.getElementById('parcel-info-panel');
            if (panelContentEl) panelContentEl.innerHTML = panelContent; // Đổ dữ liệu vào vùng chứa nội dung
            if (panelEl) panelEl.style.display = 'block';                // Hiển thị khung bảng thông tin lên màn hình
        });

        // Thiết lập sự kiện con trỏ chuột khi rê chuột vào hoặc ra khỏi vùng thửa đất
        map.on('mouseenter', layerId, () => map.getCanvas().style.cursor = 'default');
        map.on('mouseleave', layerId, () => map.getCanvas().style.cursor = 'default');
    });

    // SỰ KIỆN CLICK VÀO VÙNG TRỐNG TRÊN BẢN ĐỒ (Không bấm trúng thửa đất nào)
    map.on('click', (e) => {
        if (!isFeatureClicked) {
            closeParcelPanel(); // Ẩn bảng thông tin chi tiết và xóa trạng thái highlight đang chọn

            // Gọi hàm nhận diện tọa độ điểm vừa bấm để tự động chọn lại Phường/Xã tương ứng
            if (typeof selectPhuongFromPoint === 'function') {
                selectPhuongFromPoint(e.lngLat.lng, e.lngLat.lat, map);
            }
        }
        isFeatureClicked = false; // Đặt lại trạng thái biến cờ sau khi hoàn tất chuỗi sự kiện click
    });
}

// Lắng nghe sự kiện toàn bộ cấu trúc mã HTML/DOM đã được tải hoàn tất thì tự động kích hoạt hàm khởi tạo bản đồ
document.addEventListener('DOMContentLoaded', initMap);
