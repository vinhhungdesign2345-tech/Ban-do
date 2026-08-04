// js/searchThuaDat.js

/**
 * Hàm khởi tạo ô tìm kiếm thửa đất toàn cục (Không bắt buộc chọn tỉnh/phường trước)
 * @param {Object} map - Instance bản đồ MapLibre
 */
function initThuaDatSearch(map) {
    const searchInput = document.getElementById('searchThuaDatInput');
    if (!searchInput) return;

    // Hàm chuẩn hóa tiếng Việt: chuyển có dấu thành không dấu và về chữ thường
    const removeAccentsAndLower = (str) => {
        if (!str) return '';
        return String(str)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'd');
    };

    const performSearch = () => {
        const rawKeyword = searchInput.value.trim();
        const keyword = removeAccentsAndLower(rawKeyword);
        
        const phuongSelect = document.getElementById('phuongFilter');
        const selectedPhuong = phuongSelect ? phuongSelect.value : '';

        // 1. Nếu ô tìm kiếm trống, khôi phục lại trạng thái hiển thị theo bộ lọc hành chính (nếu có)
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

        // Lấy tất cả các đối tượng thửa đất đang hiển thị trên bản đồ để quét dữ liệu
        let features = map.queryRenderedFeatures({ layers: ['sheet-thua-dat-fill'] });
        
        const matchedIds = [];
        const targetFeatures = (features && features.length > 0) ? features : [];
        
        targetFeatures.forEach(f => {
            const props = f.properties || {};
            const tenChu = removeAccentsAndLower(props['Tên Chủ'] || props['Tên chủ'] || '');
            const soDinhDanh = removeAccentsAndLower(props['Số định danh chủ đất'] || props['Số định danh'] || '');
            const soTo = removeAccentsAndLower(props['Số tờ'] || props['So to'] || '');
            const soThua = removeAccentsAndLower(props['Số thửa'] || props['So thua'] || '');
            const ghiChu = removeAccentsAndLower(props['Ghi Chú'] || props['Ghi chú'] || '');
            const diaChi = props['Địa Chỉ Thửa Đất'] || '';

            // Kiểm tra khớp từ khóa trên các trường thông tin
            const isMatch = 
                tenChu.includes(keyword) || 
                soDinhDanh.includes(keyword) || 
                soTo.includes(keyword) || 
                soThua.includes(keyword) || 
                ghiChu.includes(keyword);

            // Nếu người dùng có chọn thêm phường/xã thì mới lọc kết hợp, còn không thì tìm trên toàn cục
            const matchPhuong = selectedPhuong ? (diaChi === selectedPhuong) : true;

            if (isMatch && matchPhuong) {
                const uniqueId = props['ID Thửa Đất'] || props['id'] || props['Tên Chủ'];
                if (uniqueId && !matchedIds.includes(uniqueId)) {
                    matchedIds.push(uniqueId);
                }
            }
        });

        // 2. Tạo biểu thức lọc áp dụng lên MapLibre Layer
        let finalFilter;
        if (matchedIds.length > 0) {
            finalFilter = ['in', ['get', 'ID Thửa Đất'], ['literal', matchedIds]];
        } else {
            finalFilter = ['==', ['get', 'ID Thửa Đất'], '___no_match___'];
        }

        if (map.getLayer('sheet-thua-dat-fill')) {
            map.setFilter('sheet-thua-dat-fill', finalFilter);
        }
        if (map.getLayer('sheet-thua-dat-line')) {
            map.setFilter('sheet-thua-dat-line', finalFilter);
        }

        // 3. Tự động thu phóng màn hình đến khu vực kết quả tìm thấy
        setTimeout(() => {
            try {
                const renderedMatched = map.queryRenderedFeatures({ layers: ['sheet-thua-dat-fill'] });
                if (renderedMatched && renderedMatched.length > 0) {
                    const fc = turf.featureCollection(renderedMatched);
                    const bbox = turf.bbox(fc);
                    map.fitBounds(bbox, { padding: 60, maxZoom: 18 });
                } else {
                    alert("Không tìm thấy thửa đất nào phù hợp với từ khóa: " + rawKeyword);
                }
            } catch (err) {
                console.log("Lỗi zoom kết quả:", err);
            }
        }, 300);
    };

    // Bắt sự kiện nhấn Enter trên ô tìm kiếm
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });

    // Tự động reset bản đồ khi xóa trắng ô input
    searchInput.addEventListener('input', (e) => {
        if (e.target.value.trim() === '') {
            performSearch();
        }
    });
}
