// js/searchThuaDat.js

/**
 * Hàm khởi tạo ô tìm kiếm thửa đất (Hỗ trợ tìm toàn quốc hoặc theo tỉnh/phường khi nhấn Enter)
 * @param {Object} map - Instance bản đồ MapLibre
 */
function initThuaDatSearch(map) {
    const searchInput = document.getElementById('searchThuaDatInput');
    if (!searchInput) return;

    // Hàm thực hiện logic tìm kiếm và lọc bản đồ
    const performSearch = () => {
        const keyword = searchInput.value.trim().toLowerCase();
        
        const tinhSelect = document.getElementById('tinhFilter');
        const phuongSelect = document.getElementById('phuongFilter');
        const selectedTinh = tinhSelect ? tinhSelect.value : '';
        const selectedPhuong = phuongSelect ? phuongSelect.value : '';

        // 1. Nếu ô tìm kiếm trống, khôi phục lại trạng thái hiển thị theo bộ lọc hành chính
        if (!keyword) {
            if (selectedPhuong) {
                const sheetFilterExpr = ['==', ['get', 'Địa Chỉ Thửa Đất'], selectedPhuong];
                if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', sheetFilterExpr);
                if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', sheetFilterExpr);
            } else if (selectedTinh) {
                const showAllFilter = ['!=', '$type', 'Point'];
                if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', showAllFilter);
                if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', showAllFilter);
            } else {
                // Chưa chọn gì và xóa ô tìm kiếm -> ẩn lớp thửa đất
                if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', ['==', '$type', 'Point']);
                if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', ['==', '$type', 'Point']);
            }
            return;
        }

        // 2. Tạo biểu thức lọc chính xác cho MapLibre
        // Lưu ý: Các tên trường ('Ten', 'MaDinhDanh', 'SoTo', 'SoThua') phải khớp với tên thuộc tính trong dữ liệu của bạn.
        // Nếu tên cột trong dữ liệu tiếng Việt có dấu (ví dụ: 'Tên Chủ', 'Số Thửa'), hãy thay thế chính xác vào bên dưới.
        const keywordFilter = [
            'any',
            ['==', ['downcase', ['to-string', ['get', 'Ten']]], keyword],
            ['==', ['downcase', ['to-string', ['get', 'MaDinhDanh']]], keyword],
            ['==', ['downcase', ['to-string', ['get', 'SoTo']]], keyword],
            ['==', ['downcase', ['to-string', ['get', 'SoThua']]] , keyword],
            // Hỗ trợ tìm kiếm chứa từ khóa (substring) nếu cần thiết qua biểu thức so sánh chuỗi
            ['>=', ['index-of', keyword, ['downcase', ['to-string', ['get', 'Ten']]]], 0],
            ['>=', ['index-of', keyword, ['downcase', ['to-string', ['get', 'MaDinhDanh']]]], 0],
            ['>=', ['index-of', keyword, ['downcase', ['to-string', ['get', 'SoTo']]]], 0],
            ['>=', ['index-of', keyword, ['downcase', ['to-string', ['get', 'SoThua']]]], 0]
        ];

        let finalFilter = keywordFilter;

        // 3. Nếu người dùng đã chọn Phường/Xã trước đó, kết hợp thêm điều kiện lọc Phường
        if (selectedPhuong) {
            finalFilter = [
                'all',
                ['==', ['get', 'Địa Chỉ Thửa Đất'], selectedPhuong],
                keywordFilter
            ];
        }

        // Áp dụng bộ lọc lên các lớp thửa đất trên bản đồ
        if (map.getLayer('sheet-thua-dat-fill')) {
            map.setFilter('sheet-thua-dat-fill', finalFilter);
        }
        if (map.getLayer('sheet-thua-dat-line')) {
            map.setFilter('sheet-thua-dat-line', finalFilter);
        }

        // Tự động thu phóng đến khu vực có kết quả tìm thấy
        setTimeout(() => {
            try {
                const features = map.queryRenderedFeatures({ layers: ['sheet-thua-dat-fill'] });
                if (features && features.length > 0) {
                    const fc = turf.featureCollection(features);
                    const bbox = turf.bbox(fc);
                    map.fitBounds(bbox, { padding: 50, maxZoom: 18 });
                } else {
                    alert("Không tìm thấy thửa đất phù hợp với từ khóa này!");
                }
            } catch (err) {
                console.log("Lỗi zoom kết quả tìm kiếm:", err);
            }
        }, 300); // Đợi một nhịp ngắn để MapLibre cập nhật xong bộ lọc layer
    };

    // Lắng nghe sự kiện nhấn phím Enter trên ô input
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });

    // Hỗ trợ xóa trắng ô input thì tự động reset bản đồ
    searchInput.addEventListener('input', (e) => {
        if (e.target.value.trim() === '') {
            performSearch();
        }
    });
}
