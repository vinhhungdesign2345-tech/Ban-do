// js/searchThuaDat.js

/**
 * Hàm khởi tạo ô tìm kiếm thửa đất theo Tên, Mã định danh, Số tờ hoặc Số thửa
 * @param {Object} map - Instance bản đồ MapLibre
 */
function initThuaDatSearch(map) {
    const searchInput = document.getElementById('searchThuaDatInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.trim().toLowerCase();

        // Nếu ô tìm kiếm trống, khôi phục lại bộ lọc theo phường/xã hiện tại (hoặc hiển thị toàn bộ)
        if (!keyword) {
            const phuongSelect = document.getElementById('phuongFilter');
            const selectedPhuong = phuongSelect ? phuongSelect.value : '';
            
            if (selectedPhuong) {
                const sheetFilterExpr = ['==', ['get', 'Địa Chỉ Thửa Đất'], selectedPhuong];
                if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', sheetFilterExpr);
                if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', sheetFilterExpr);
            } else {
                if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', ['!=', '$type', 'Point']);
                if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', ['!=', '$type', 'Point']);
            }
            return;
        }

        // Tạo biểu thức tìm kiếm không phân biệt hoa thường với các trường thông tin thửa đất
        // Lưu ý: Thay đổi tên thuộc tính ('Ten', 'MaDinhDanh', 'SoTo', 'SoThua') cho khớp với cột dữ liệu thực tế của bạn
        const searchFilter = [
            'any',
            ['==', ['index-of', keyword, ['downcase', ['to-string', ['get', 'Ten']]]], true],
            ['==', ['index-of', keyword, ['downcase', ['to-string', ['get', 'MaDinhDanh']]]], true],
            ['==', ['index-of', keyword, ['downcase', ['to-string', ['get', 'SoTo']]]], true],
            ['==', ['index-of', keyword, ['downcase', ['to-string', ['get', 'SoThua']]]], true]
        ];

        // Áp dụng bộ lọc tìm kiếm lên các lớp dữ liệu thửa đất trên bản đồ
        if (map.getLayer('sheet-thua-dat-fill')) {
            map.setFilter('sheet-thua-dat-fill', searchFilter);
        }
        if (map.getLayer('sheet-thua-dat-line')) {
            map.setFilter('sheet-thua-dat-line', searchFilter);
        }
    });
}
