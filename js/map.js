// js/map.js

// 🎯 Hàm định dạng số chuẩn Việt Nam: 1.234,5
function formatNumberVN(val) {
    // Kiểm tra nếu giá trị trống hoặc dấu gạch ngang thì trả về nguyên bản dấu '-'
    if (val === null || val === undefined || val === '' || val === '-') return '-';
    
    // Chuyển đổi dấu phẩy (nếu có trong dữ liệu chuỗi) thành dấu chấm để hàm parseFloat có thể đọc được dạng số thực
    const num = parseFloat(String(val).replace(',', '.'));
    // Nếu sau khi chuyển đổi mà không phải là số hợp lệ thì trả về giá trị gốc ban đầu
    if (isNaN(num)) return val;

    // Định dạng số theo chuẩn văn hóa Việt Nam (dấu chấm phân cách hàng nghìn, dấu phẩy phân cách phần thập phân)
    return num.toLocaleString('vi-VN');
}

// Hàm đóng bảng thông tin phía dưới màn hình và xóa trạng thái làm nổi bật (highlight) thửa đất
function closeParcelPanel() {
    const panel = document.getElementById('parcel-info-panel');
    if (panel) panel.style.display = 'none'; // Ẩn khung panel thông tin đi

    const mapInstance = window.currentMapInstance;
    if (mapInstance) {
        // Đặt lại bộ lọc highlight phần tô nền về rỗng (tắt hiệu ứng chọn)
        if (mapInstance.getLayer('sheet-thua-dat-highlight-fill')) {
            mapInstance.setFilter('sheet-thua-dat-highlight-fill', ['==', ['get', 'ID Thửa Đất'], '']);
        }
        // Đặt lại bộ lọc highlight đường viền về rỗng
        if (mapInstance.getLayer('sheet-thua-dat-highlight-line')) {
            mapInstance.setFilter('sheet-thua-dat-highlight-line', ['==', ['get', 'ID Thửa Đất'], '']);
        }
    }
}

function initMap() {
    // Khởi tạo đối tượng bản đồ MapLibre GL gắn vào thẻ div có id là 'map'
    const map = new maplibregl.Map({
        container: 'map',
        style: CONFIG.MAP_STYLE,       // Lấy cấu hình style nền bản đồ từ file config.js
        center: CONFIG.MAP_CENTER,     // Tọa độ trung tâm mặc định
        zoom: CONFIG.MAP_ZOOM          // Mức độ phóng to mặc định
    });

    // Lưu trữ instance của bản đồ ra biến toàn cục window để các hàm khác có thể gọi dùng lại khi cần
    window.currentMapInstance = map;

    // Sự kiện chờ bản đồ tải xong hoàn tất thì tiến hành gọi bộ lọc dữ liệu và ô tìm kiếm
    map.on('load', () => {
        initFilter(map);          // Khởi tạo bộ lọc tỉnh/xã
        initThuaDatSearch(map);   // Khởi tạo chức năng tìm kiếm thửa đất
    });

    // Mảng chứa các ID lớp dữ liệu thửa đất (gồm lớp phủ màu và lớp đường viền)
    const sheetLayers = ['sheet-thua-dat-fill', 'sheet-thua-dat-line'];
    let isFeatureClicked = false; // Biến cờ (flag) kiểm tra xem người dùng có bấm trúng thửa đất hay không

    // Lặp qua từng lớp thửa đất để gán sự kiện bấm chuột
    sheetLayers.forEach(layerId => {
        map.on('click', layerId, (e) => {
            if (!e.features || !e.features.length) return; // Nếu không lấy được thông tin đối tượng thì dừng lại

            isFeatureClicked = true; // Đánh dấu xác nhận là đã click trúng thửa đất

            const selectedFeature = e.features[0]; // Lấy ra thửa đất đầu tiên được click trúng
            const rawProps = selectedFeature.properties || {}; // Lấy toàn bộ thuộc tính dữ liệu của thửa đất đó

            // 🎯 Lấy trực tiếp các trường thông tin chính xác từ thuộc tính gốc (hỗ trợ nhiều kiểu tên viết hoa/thường khác nhau)
            const soTo = rawProps['Số tờ'] || rawProps['So to'] || '-';
            const soThua = rawProps['Số thửa'] || rawProps['So thua'] || '-';
            
            const rawDienTich = rawProps['Diện tích'] || rawProps['Dien tich'] || '-';
            const dienTich = formatNumberVN(rawDienTich); // Gọi hàm định dạng số diện tích chuẩn Việt Nam

            const loaiDat = rawProps['Loại Đất'] || rawProps['Loại Đất:'] || rawProps['Loại đất'] || rawProps['loai_dat'] || '-';
            const tenChu = rawProps['Tên Chủ'] || rawProps['Tên chủ'] || '-';
            const soDinhDanh = rawProps['Số định danh chủ đất'] || rawProps['Số định danh'] || 'Không có';
            const ghiChu = rawProps['Ghi Chú'] || rawProps['Ghi chú'] || 'Không có';

            const parcelId = rawProps['ID Thửa Đất'] || rawProps['id'];

            // Xây dựng bộ lọc điều kiện để tô màu làm nổi bật thửa đất vừa chọn trên bản đồ
            let selectFilter;
            if (parcelId) {
                selectFilter = ['==', ['get', 'ID Thửa Đất'], rawProps['ID Thửa Đất'] || parcelId];
            } else {
                selectFilter = ['==', ['get', 'Tên Chủ'], rawProps['Tên Chủ'] || tenChu];
            }

            // Áp dụng bộ lọc highlight cho lớp phủ nền
            if (map.getLayer('sheet-thua-dat-highlight-fill')) {
                map.setFilter('sheet-thua-dat-highlight-fill', selectFilter);
            }
            // Áp dụng bộ lọc highlight cho lớp đường viền
            if (map.getLayer('sheet-thua-dat-highlight-line')) {
                map.setFilter('sheet-thua-dat-highlight-line', selectFilter);
            }

            // ĐỔ DỮ LIỆU VÀO KHUNG PANEL HIỂN THỊ DƯỚI MÀN HÌNH
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
            if (panelContentEl) panelContentEl.innerHTML = panelContent; // Đưa nội dung HTML vào khung
            if (panelEl) panelEl.style.display = 'block';                 // Hiển thị khung bảng thông tin lên màn hình
        });

        // Thiết lập sự kiện con trỏ chuột khi di chuyển vào/ra vùng thửa đất (giữ nguyên mặc định)
        map.on('mouseenter', layerId, () => map.getCanvas().style.cursor = 'default');
        map.on('mouseleave', layerId, () => map.getCanvas().style.cursor = 'default');
    });

    // 🔴 SỰ KIỆN CLICK VÙNG TRỐNG TRÊN BẢN ĐỒ (Xử lý khi bấm ngoài thửa đất)
    map.on('click', (e) => {
        if (!isFeatureClicked) {
            closeParcelPanel(); // Nếu không bấm trúng thửa đất thì ẩn bảng thông tin đi và reset highlight

            // Gọi hàm chọn Phường/Xã tương ứng ngay tại tọa độ điểm vừa bấm chuột xuống bản đồ
            if (typeof selectPhuongFromPoint === 'function') {
                selectPhuongFromPoint(e.lngLat.lng, e.lngLat.lat, map);
            }
        }
        isFeatureClicked = false; // Đặt lại trạng thái cờ kiểm tra sau mỗi lần click
    });
}

// Lắng nghe sự kiện trang web đã tải hoàn tất toàn bộ cấu trúc DOM thì kích hoạt hàm khởi tạo bản đồ initMap
document.addEventListener('DOMContentLoaded', initMap);
