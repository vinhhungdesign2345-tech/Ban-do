// js/searchThuaDat.js

/**
 * Hàm khởi tạo ô tìm kiếm thửa đất (Hỗ trợ tìm toàn quốc khi chưa chọn tỉnh, hoặc tìm thu hẹp trong tỉnh/phường khi đã chọn)
 * @param {Object} map - Instance bản đồ MapLibre
 */
function initThuaDatSearch(map) {
    const searchInput = document.getElementById('searchThuaDatInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.trim().toLowerCase();
        
        // Lấy giá trị tỉnh và phường đang được chọn trên giao diện
        const tinhSelect = document.getElementById('tinhFilter');
        const phuongSelect = document.getElementById('phuongFilter');
        const selectedTinh = tinhSelect ? tinhSelect.value : '';
        const selectedPhuong = phuongSelect ? phuongSelect.value : '';

        // 1. Nếu ô tìm kiếm trống
        if (!keyword) {
            if (selectedPhuong) {
                // Nếu đang chọn phường -> giữ nguyên lọc theo phường
                const sheetFilterExpr = ['==', ['get', 'Địa Chỉ Thửa Đất'], selectedPhuong];
                if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', sheetFilterExpr);
                if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', sheetFilterExpr);
            } else if (selectedTinh) {
                // Nếu đang chọn tỉnh nhưng chưa chọn phường -> hiển thị toàn bộ thửa đất của tỉnh đó
                const showAllFilter = ['!=', '$type', 'Point'];
                if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', showAllFilter);
                if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', showAllFilter);
            } else {
                // Chưa chọn gì cả -> ẩn hoặc reset lớp thửa đất
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

        // 3. Kết hợp điều kiện phạm vi địa lý nếu người dùng đã chọn Tỉnh hoặc Phường trước đó
        if (selectedPhuong) {
            // Vừa đúng từ khóa VÀ đúng Phường
            finalFilter = [
                'all',
                ['==', ['get', 'Địa Chỉ Thửa Đất'], selectedPhuong],
                keywordFilter
            ];
        } else if (selectedTinh) {
            // Nếu bạn có cột chứa mã/tên tỉnh trong dữ liệu thửa đất (ví dụ: 'Tinh' hoặc 'MaTinh'), 
            // có thể thêm điều kiện lọc theo tỉnh ở đây. Nếu sheet chứa chung dữ liệu của tỉnh đang load thì keywordFilter là đủ.
            finalFilter = keywordFilter;
        }

        // Áp dụng bộ lọc hoàn chỉnh lên bản đồ
        if (map.getLayer('sheet-thua-dat-fill')) {
            map.setFilter('sheet-thua-dat-fill', finalFilter);
        }
        if (map.getLayer('sheet-thua-dat-line')) {
            map.setFilter('sheet-thua-dat-line', finalFilter);
        }
    });
}
