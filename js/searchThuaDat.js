// js/searchThuaDat.js

/**
 * Hàm khởi tạo ô tìm kiếm thửa đất (Hỗ trợ tìm toàn quốc hoặc theo tỉnh/phường khi nhấn Enter)
 * @param {Object} map - Instance bản đồ MapLibre
 */
function initThuaDatSearch(map) {
    const searchInput = document.getElementById('searchThuaDatInput');
    if (!searchInput) return;

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
                if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', ['==', '$type', 'Point']);
                if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', ['==', '$type', 'Point']);
            }
            return;
        }

        // 2. Sử dụng đúng tên các trường tiếng Việt có dấu khớp với Google Sheet / GeoJSON của bạn
        const keywordFilter = [
            'any',
            ['>=', ['index-of', keyword, ['downcase', ['to-string', ['get', 'Tên Chủ']]]], 0],
            ['>=', ['index-of', keyword, ['downcase', ['to-string', ['get', 'Số định danh chủ đất']]]], 0],
            ['>=', ['index-of', keyword, ['downcase', ['to-string', ['get', 'Số tờ']]]], 0],
            ['>=', ['index-of', keyword, ['downcase', ['to-string', ['get', 'Số thửa']]]], 0]
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
        }, 300);
    };

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });

    searchInput.addEventListener('input', (e) => {
        if (e.target.value.trim() === '') {
            performSearch();
        }
    });
}
```[cite: 8]
