// js/searchThuaDat.js

/**
 * Hàm khởi tạo ô tìm kiếm thửa đất (Hỗ trợ tìm kiếm không phân biệt chữ hoa/thường, không phân biệt dấu tiếng Việt)
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

        // Lấy toàn bộ các features (đối tượng thửa đất) đang có trên bản đồ nguồn
        const allFeaturesSource = map.querySourceFeatures('sheet-thua-dat-source'); // Đảm bảo tên source trùng khớp với config của bạn
        
        // Nếu không query trực tiếp được từ source, fallback dùng queryRenderedFeatures
        let features = map.queryRenderedFeatures({ layers: ['sheet-thua-dat-fill'] });
        
        // Lọc toàn diện toàn bộ kho dữ liệu theo từ khóa (Không phân biệt hoa thường, không phân biệt dấu)
        // Tìm kiếm trên các trường: Tên Chủ, Số định danh chủ đất, Số tờ, Số thửa, Ghi chú
        const matchedIds = [];
        
        // Duyệt qua tất cả các features có sẵn trong layer hoặc source
        const targetFeatures = (features && features.length > 0) ? features : [];
        
        targetFeatures.forEach(f => {
            const props = f.properties || {};
            const tenChu = removeAccentsAndLower(props['Tên Chủ'] || props['Tên chủ'] || '');
            const soDinhDanh = removeAccentsAndLower(props['Số định danh chủ đất'] || props['Số định danh'] || '');
            const soTo = removeAccentsAndLower(props['Số tờ'] || props['So to'] || '');
            const soThua = removeAccentsAndLower(props['Số thửa'] || props['So thua'] || '');
            const ghiChu = removeAccentsAndLower(props['Ghi Chú'] || props['Ghi chú'] || '');
            const diaChi = props['Địa Chỉ Thửa Đất'] || '';

            // Kiểm tra nếu từ khóa khớp với bất kỳ trường thông tin nào
            const isMatch = 
                tenChu.includes(keyword) || 
                soDinhDanh.includes(keyword) || 
                soTo.includes(keyword) || 
                soThua.includes(keyword) || 
                ghiChu.includes(keyword);

            // Nếu có chọn kèm phường xã thì lọc thêm điều kiện phường xã
            const matchPhuong = selectedPhuong ? (diaChi === selectedPhuong) : true;

            if (isMatch && matchPhuong) {
                const uniqueId = props['ID Thửa Đất'] || props['id'] || props['Tên Chủ'];
                if (uniqueId && !matchedIds.includes(uniqueId)) {
                    matchedIds.push(uniqueId);
                }
            }
        });

        // 2. Tạo biểu thức bộ lọc (Filter expression) áp dụng lên MapLibre Layer
        let finalFilter;
        if (matchedIds.length >  0) {
            // Lọc ra tất cả các thửa đất có ID nằm trong danh sách tìm thấy để hiện lên bản đồ
            finalFilter = ['in', ['get', 'ID Thửa Đất'], ['literal', matchedIds]];
        } else {
            // Nếu không tìm thấy kết quả nào, gán điều kiện rỗng để ẩn hết bản đồ tránh hiển thị sai
            finalFilter = ['==', ['get', 'ID Thửa Đất'], '___no_match___'];
        }

        if (map.getLayer('sheet-thua-dat-fill')) {
            map.setFilter('sheet-thua-dat-fill', finalFilter);
        }
        if (map.getLayer('sheet-thua-dat-line')) {
            map.setFilter('sheet-thua-dat-line', finalFilter);
        }

        // 3. Tự động thu phóng màn hình đến trọn vẹn khu vực các kết quả tìm thấy
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

    // Bắt sự kiện bấm phím Enter trên ô input tìm kiếm
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });

    // Tự động khôi phục bản đồ nếu người dùng xóa trắng ô input
    searchInput.addEventListener('input', (e) => {
        if (e.target.value.trim() === '') {
            performSearch();
        }
    });
}
