// js/searchThuaDat.js

/**
 * Hàm khởi tạo ô tìm kiếm thửa đất toàn cục, tương thích với mọi tên source bản đồ
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

        // 1. Nếu ô tìm kiếm trống, khôi phục lại trạng thái hiển thị ban đầu
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

        // 2. Thu thập toàn bộ dữ liệu thửa đất (Quét linh hoạt từ source hoặc các layer đang có)
        let allFeatures = [];
        
        // Thử lấy danh sách source đang có trên bản đồ
        const style = map.getStyle();
        if (style && style.sources) {
            for (const sourceId in style.sources) {
                const src = map.getSource(sourceId);
                if (src && src._data && src._data.features) {
                    allFeatures = allFeatures.concat(src._data.features);
                }
            }
        }

        // Nếu quét qua source chưa lấy được, lấy từ rendered features trên màn hình
        if (allFeatures.length === 0) {
            const rendered = map.queryRenderedFeatures({ layers: ['sheet-thua-dat-fill'] });
            if (rendered) allFeatures = rendered;
        }

        if (allFeatures.length === 0) {
            alert("Dữ liệu bản đồ đang được tải, vui lòng phóng to/thu nhỏ bản đồ một chút rồi thử tìm kiếm lại!");
            return;
        }

        const matchedIds = [];

        allFeatures.forEach(f => {
            const props = f.properties || {};
            const tenChu = removeAccentsAndLower(props['Tên Chủ'] || props['Tên chủ'] || '');
            const soDinhDanh = removeAccentsAndLower(props['Số định danh chủ đất'] || props['Số định danh'] || '');
            const soTo = removeAccentsAndLower(props['Số tờ'] || props['So to'] || '');
            const soThua = removeAccentsAndLower(props['Số thửa'] || props['So thua'] || '');
            const ghiChu = removeAccentsAndLower(props['Ghi Chú'] || props['Ghi chú'] || '');
            const diaChi = props['Địa Chỉ Thửa Đất'] || '';

            // Kiểm tra khớp từ khóa (không phân biệt hoa thường, không phân biệt dấu)
            const isMatch = 
                tenChu.includes(keyword) || 
                soDinhDanh.includes(keyword) || 
                soTo.includes(keyword) || 
                soThua.includes(keyword) || 
                ghiChu.includes(keyword);

            // Nếu có chọn phường xã thì lọc kèm phường xã, không thì tìm toàn cục
            const matchPhuong = selectedPhuong ? (diaChi === selectedPhuong) : true;

            if (isMatch && matchPhuong) {
                const uniqueId = props['ID Thửa Đất'] || props['id'] || props['Tên Chủ'];
                if (uniqueId && !matchedIds.includes(uniqueId)) {
                    matchedIds.push(uniqueId);
                }
            }
        });

        // 3. Đặt bộ lọc hiển thị kết quả lên bản đồ
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

        // 4. Tự động zoom đến khu vực kết quả tìm thấy
        setTimeout(() => {
            try {
                const matchedFeaturesList = allFeatures.filter(f => {
                    const id = f.properties['ID Thửa Đất'] || f.properties['id'] || f.properties['Tên Chủ'];
                    return matchedIds.includes(id);
                });

                if (matchedFeaturesList.length > 0) {
                    const fc = turf.featureCollection(matchedFeaturesList);
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

    // Bắt sự kiện nhấn Enter
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });

    // Reset khi xóa trắng ô input
    searchInput.addEventListener('input', (e) => {
        if (e.target.value.trim() === '') {
            performSearch();
        }
    });
}
