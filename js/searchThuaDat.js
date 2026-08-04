// js/searchThuaDat.js

/**
 * Hàm khởi tạo ô tìm kiếm thửa đất (Hỗ trợ tìm toàn quốc hoặc theo tỉnh/phường, bấm Enter hoặc gõ đều chạy)
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

        // 1. Nếu ô tìm kiếm trống
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

        // 2. Tạo điều kiện lọc theo từ khóa (Tìm theo Tên, Mã định danh, Số tờ, Số thửa)
        // Lưu ý: Thay đổi tên trường ('Ten', 'MaDinhDanh', 'SoTo', 'SoThua') cho khớp với cột dữ liệu của bạn
        const keywordFilter = [
            'any',
            ['==', ['index-of', keyword, ['downcase', ['to-string', ['get', 'Ten']]]], true],
            ['==', ['index-of', keyword, ['downcase', ['to-string', ['get', 'MaDinhDanh']]]], true],
            ['==', ['index-of', keyword, ['downcase', ['to-string', ['get', 'SoTo']]]], true],
            ['==', ['index-of', keyword, ['downcase', ['to-string', ['get', 'SoThua']]]], true]
        ];

        let finalFilter = keywordFilter;

        // 3. Kết hợp điều kiện phạm vi địa lý nếu người dùng đã chọn Tỉnh hoặc Phường
        if (selectedPhuong) {
            finalFilter = [
                'all',
                ['==', ['get', 'Địa Chỉ Thửa Đất'], selectedPhuong],
                keywordFilter
            ];
        }

        // Áp dụng bộ lọc hoàn chỉnh lên bản đồ
        if (map.getLayer('sheet-thua-dat-fill')) {
            map.setFilter('sheet-thua-dat-fill', finalFilter);
        }
        if (map.getLayer('sheet-thua-dat-line')) {
            map.setFilter('sheet-thua-dat-line', finalFilter);
        }

        // Tự động zoom (fitBounds) đến các thửa đất thỏa mãn điều kiện tìm kiếm nếu có dữ liệu
        try {
            const features = map.queryRenderedFeatures({ layers: ['sheet-thua-dat-fill'] });
            if (features && features.length > 0) {
                const fc = turf.featureCollection(features);
                const bbox = turf.bbox(fc);
                map.fitBounds(bbox, { padding: 50, maxZoom: 18 });
            }
        } catch (err) {
            console.log("Không thể tự động zoom đến kết quả tìm kiếm:", err);
        }
    };

    // Lắng nghe sự kiện nhấn phím Enter
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Ngăn chặn form submit mặc định (nếu có)
            performSearch();    // Thực hiện tìm kiếm khi nhấn Enter
        }
    });

    // Vẫn giữ sự kiện 'input' để lọc theo thời gian thực nếu muốn, hoặc bạn có thể bỏ dòng dưới nếu chỉ thích bấm Enter mới tìm
    searchInput.addEventListener('input', (e) => {
        if (e.target.value.trim() === '') {
            performSearch(); // Tự động reset khi xóa hết chữ
        }
    });
}
