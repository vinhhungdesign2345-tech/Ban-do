// js/searchThuaDat.js

function initThuaDatSearch(map) {
    const searchInput = document.getElementById('searchThuaDatInput');
    if (!searchInput) return;

    const performSearch = () => {
        // Chuyển toàn bộ từ khóa người dùng nhập sang chữ thường để so sánh không phân biệt hoa/thường
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
            } else {
                if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', ['==', '$type', 'Point']);
                if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', ['==', '$type', 'Point']);
            }
            return;
        }

        // 2. Lọc không phân biệt chữ hoa/thường cho các trường thông tin
        const keywordFilter = [
            'any',
            ['>=', ['index-of', keyword, ['downcase', ['to-string', ['get', 'Tên Chủ']]]], 0],
            ['>=', ['index-of', keyword, ['downcase', ['to-string', ['get', 'Số định danh chủ đất']]]], 0],
            ['>=', ['index-of', keyword, ['downcase', ['to-string', ['get', 'Số tờ']]]], 0],
            ['>=', ['index-of', keyword, ['downcase', ['to-string', ['get', 'Số thửa']]]], 0]
        ];

        let finalFilter = keywordFilter;

        if (selectedPhuong) {
            finalFilter = [
                'all',
                ['==', ['get', 'Địa Chỉ Thửa Đất'], selectedPhuong],
                keywordFilter
            ];
        }

        if (map.getLayer('sheet-thua-dat-fill')) {
            map.setFilter('sheet-thua-dat-fill', finalFilter);
        }
        if (map.getLayer('sheet-thua-dat-line')) {
            map.setFilter('sheet-thua-dat-line', finalFilter);
        }

        // Tự động thu phóng đến khu vực tìm thấy kết quả
        setTimeout(() => {
            try {
                const features = map.queryRenderedFeatures({ layers: ['sheet-thua-dat-fill'] });
                if (features && features.length > 0) {
                    const fc = turf.featureCollection(features);
                    const bbox = turf.bbox(fc);
                    map.fitBounds(bbox, { padding: 50, maxZoom: 18 });
                } else {
                    alert("Không tìm thấy thửa đất phù hợp!");
                }
            } catch (err) {
                console.log("Lỗi zoom kết quả:", err);
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
