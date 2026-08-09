// js/map.js

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
    }
}

// --- HÀM KHỞI TẠO VÀ CẤU HÌNH TOÀN BỘ BẢN ĐỒ ---
function initMap() {
    // Khởi tạo một đối tượng bản đồ MapLibre mới gắn vào thẻ div có id là 'map'
    const map = new maplibregl.Map({
        container: 'map',                   // ID của thẻ HTML chứa bản đồ
        style: CONFIG.MAP_STYLE,            // Giao diện/phong cách bản đồ được lấy từ tệp cấu hình chung (config.js)
        center: CONFIG.MAP_CENTER,          // Tọa độ trung tâm mặc định khi khởi tạo bản đồ
        zoom: CONFIG.MAP_ZOOM               // Mức độ phóng to (zoom) mặc định ban đầu của bản đồ
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
        const toggleBtn = document.getElementById('toggleLayerBtn');
        if (toggleBtn) {
            // Lắng nghe hành động nhấn chuột vào nút chuyển đổi lớp bản đồ nền
            toggleBtn.addEventListener('click', function() {
                const satLayer = 'google-satellite-layer'; // Định danh lớp bản đồ vệ tinh
                const osmLayer = 'osm-layer';             // Định danh lớp bản đồ đường phố OSM
                
                // Kiểm tra xem lớp vệ tinh hiện tại có đang hiển thị (visible) hay không
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
            // Nếu không có đối tượng không gian nào được chọn hoặc danh sách rỗng thì dừng lại
            if (!e.features || !e.features.length) return;
            isFeatureClicked = true; // Đánh dấu là đã click trúng thửa đất

            const selectedFeature = e.features[0];       // Lấy thửa đất đầu tiên trong danh sách các đối tượng bị click
            const rawProps = selectedFeature.properties || {}; // Lấy toàn bộ tập dữ liệu thuộc tính đi kèm của thửa đất

            // Trích xuất các trường thông tin chi tiết, hỗ trợ nhiều định dạng tên cột khác nhau từ nguồn dữ liệu
            const soTo = rawProps['Số tờ'] || rawProps['So to'] || '-';
            const soThua = rawProps['Số thửa'] || rawProps['So thua'] || '-';
            const rawDienTich = rawProps['Diện tích'] || rawProps['Dien tich'] || '-';
            const dienTich = formatNumberVN(rawDienTich); // Định dạng lại diện tích theo chuẩn số Việt Nam
            const loaiDat = rawProps['Loại Đất'] || rawProps['Loại Đất:'] || rawProps['Loại đất'] || rawProps['loai_dat'] || '-';
            const tenChu = rawProps['Tên Chủ'] || rawProps['Tên chủ'] || '-';
            const soDinhDanh = rawProps['Số định danh chủ đất'] || rawProps['Số định danh'] || 'Không có';
            const ghiChu = rawProps['Ghi Chú'] || rawProps['Ghi chú'] || 'Không có';
            const parcelId = rawProps['ID Thửa Đất'] || rawProps['id'];

            // Xây dựng bộ lọc logic để xác định ID thửa đất hoặc tên chủ nhằm bôi đậm/highlight đối tượng được chọn
            let selectFilter = parcelId ? ['==', ['get', 'ID Thửa Đất'], rawProps['ID Thửa Đất'] || parcelId] : ['==', ['get', 'Tên Chủ'], tenChu];

            // Áp dụng bộ lọc highlight lên lớp mảng tô màu thửa đất nếu lớp đó tồn tại
            if (map.getLayer('sheet-thua-dat-highlight-fill')) map.setFilter('sheet-thua-dat-highlight-fill', selectFilter);
            // Áp dụng bộ lọc highlight lên lớp đường viền ranh giới thửa đất nếu lớp đó tồn tại
            if (map.getLayer('sheet-thua-dat-highlight-line')) map.setFilter('sheet-thua-dat-highlight-line', selectFilter);

            // Tạo đoạn mã HTML chứa cấu trúc hiển thị thông tin chi tiết của thửa đất để đổ vào bảng panel
            const panelContent = `
                <div><b>Số tờ:</b> ${soTo}</div>
                <div><b>Số thửa:</b> ${soThua}</div>
                <div><b>Diện tích:</b> ${dienTich} m²</div>
                <div><b>Loại đất:</b> ${loaiDat}</div>
                <div style="grid-column: span 2;"><b>Tên chủ:</b> ${tenChu}</div>
                <div><b>Số định danh:</b> ${soDinhDanh}</div>
                <div><b>Ghi chú:</b> ${ghiChu}</div>
            `;

            // Lấy các phần tử HTML của bảng thông tin dưới màn hình
            const panelContentEl = document.getElementById('panel-content');
            const panelEl = document.getElementById('parcel-info-panel');
            // Đưa nội dung HTML chi tiết vào bên trong khung panel
            if (panelContentEl) panelContentEl.innerHTML = panelContent;
            // Hiển thị khung panel thông tin lên màn hình bằng cách đổi style thành 'block'
            if (panelEl) panelEl.style.display = 'block';
        });

        // Thiết lập giao diện con trỏ chuột giữ nguyên mặc định khi rê chuột vào đối tượng thửa đất
        map.on('mouseenter', layerId, () => map.getCanvas().style.cursor = 'default');
        // Thiết lập giao diện con trỏ chuột giữ nguyên mặc định khi rời khỏi đối tượng thửa đất
        map.on('mouseleave', layerId, () => map.getCanvas().style.cursor = 'default');
    });

    // Lắng nghe sự kiện click trực tiếp lên vùng trống của nền bản đồ (không click trúng thửa đất nào)
    map.on('click', (e) => {
        // Nếu biến cờ xác nhận không có thửa đất nào được click trước đó
        if (!isFeatureClicked) {
            closeParcelPanel(); // Gọi hàm đóng bảng thông tin và xóa trạng thái highlight hiện tại
            // Nếu hàm tra cứu xã/phường theo tọa độ điểm tồn tại, tiến hành kích hoạt tra cứu theo vị trí click
            if (typeof selectPhuongFromPoint === 'function') {
                selectPhuongFromPoint(e.lngLat.lng, e.lngLat.lat, map);
            }
        }
        isFeatureClicked = false; // Đặt lại trạng thái biến cờ về false sau khi xử lý xong cú click
    });
}

// Lắng nghe sự kiện toàn bộ cấu trúc trang HTML đã được tải xong xuôi, sau đó kích hoạt thực thi hàm khởi tạo bản đồ
document.addEventListener('DOMContentLoaded', initMap);
