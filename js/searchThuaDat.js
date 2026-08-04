// js/searchThuaDat.js

// Khai báo hàm chính nhận vào đối tượng bản đồ (map) từ MapLibre
function initThuaDatSearch(map) {
    
    // Lấy phần tử ô nhập liệu tìm kiếm theo ID trên giao diện HTML
    const searchInput = document.getElementById('searchThuaDatInput');
    
    // Nếu không tìm thấy ô input trên trang thì dừng hàm luôn để tránh lỗi
    if (!searchInput) return;

    // Hàm phụ trợ: Chuẩn hóa tiếng Việt (bỏ dấu, chuyển về chữ thường, đổi chữ 'đ' thành 'd')
    const removeAccentsAndLower = (str) => {
        if (!str) return ''; // Nếu chuỗi rỗng thì trả về rỗng
        return String(str)
            .toLowerCase() // Chuyển tất cả thành chữ thường
            .normalize('NFD') // Tách các dấu chữ cái tiếng Việt
            .replace(/[\u0300-\u036f]/g, '') // Xóa các ký tự dấu sau khi tách
            .replace(/đ/g, 'd') // Thay thế chữ 'đ' thường
            .replace(/Đ/g, 'd'); // Thay thế chữ 'Đ' hoa
    };

    // Hàm cốt lõi xử lý logic khi thực hiện tìm kiếm
    const performSearch = () => {
        // Lấy từ khóa người dùng gõ vào, cắt bỏ khoảng trắng thừa ở đầu/cuối
        const rawKeyword = searchInput.value.trim();
        
        // Chuẩn hóa từ khóa vừa nhập (không dấu, chữ thường) để tìm kiếm chính xác
        const keyword = removeAccentsAndLower(rawKeyword);

        // Nếu người dùng xóa trống ô tìm kiếm (không có từ khóa)
        if (!keyword) {
            // Khôi phục lại trạng thái ẩn hoặc reset bộ lọc layer thửa đất trên bản đồ
            if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', ['==', '$type', 'Point']);
            if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', ['==', '$type', 'Point']);
            return; // Thoát hàm
        }

        // 1. Thu thập dữ liệu trực tiếp từ tất cả các source (nguồn dữ liệu) đang có trên bản đồ
        let allFeatures = [];
        const style = map.getStyle(); // Lấy thông tin style hiện tại của bản đồ
        if (style && style.sources) {
            for (const sourceId in style.sources) {
                const src = map.getSource(sourceId);
                // Kiểm tra nếu source có chứa dữ liệu dạng GeoJSON thô thì gom lại
                if (src && src._data && src._data.features) {
                    allFeatures = allFeatures.concat(src._data.features);
                }
            }
        }

        // 2. Dự phòng: Nếu lấy từ source chưa được, tiến hành quét qua các đối tượng đang hiển thị trên màn hình
        if (allFeatures.length === 0) {
            const rendered = map.queryRenderedFeatures({ layers: ['sheet-thua-dat-fill'] });
            if (rendered) allFeatures = rendered;
        }

        // Nếu sau cả 2 cách mà vẫn không có dữ liệu, hiện cảnh báo yêu cầu người dùng chờ lát
        if (allFeatures.length === 0) {
            alert("Dữ liệu bản đồ đang tải, vui lòng chờ 1-2 giây rồi bấm tìm kiếm lại!");
            return;
        }

        // 3. Tiến hành quét tìm kiếm trong toàn bộ tập dữ liệu thửa đất
        const matchedIds = []; // Mảng lưu các ID thửa đất khớp với từ khóa
        allFeatures.forEach(f => {
            const props = f.properties || {}; // Lấy danh sách thuộc tính của thửa đất
            let combinedText = "";
            
            // Duyệt qua tất cả các trường thuộc tính và gom lại thành một chuỗi văn bản lớn
            for (let key in props) {
                if (props[key]) combinedText += " " + removeAccentsAndLower(props[key]);
            }

            // Nếu chuỗi văn bản tổng hợp chứa từ khóa người dùng tìm kiếm
            if (combinedText.includes(keyword)) {
                // Lấy mã định danh độc lập của thửa đất theo thứ tự ưu tiên các trường
                const uniqueId = props['ID Thửa Đất'] || props['id'] || props['Tên Chủ'];
                // Nếu có ID và chưa tồn tại trong mảng kết quả thì thêm vào
                if (uniqueId && !matchedIds.includes(uniqueId)) {
                    matchedIds.push(uniqueId);
                }
            }
        });

        // 4. Thiết lập bộ lọc (Filter) để chỉ hiển thị các thửa đất khớp kết quả lên bản đồ
        let finalFilter;
        if (matchedIds.length > 0) {
            // Nếu tìm thấy: Lọc lấy các thửa có ID nằm trong danh sách matchedIds
            finalFilter = ['in', ['get', 'ID Thửa Đất'], ['literal', matchedIds]];
        } else {
            // Nếu không tìm thấy: Đặt điều kiện lọc không khớp với bất kỳ ai để ẩn hết đi
            finalFilter = ['==', ['get', 'ID Thửa Đất'], '___no_match___'];
        }

        // Áp dụng bộ lọc lên layer phần tô màu (fill) và phần viền (line) của thửa đất
        if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', finalFilter);
        if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', finalFilter);

        // 5. Tự động thu phóng (zoom) đến khu vực chứa kết quả và hiển thị thông báo
        setTimeout(() => {
            try {
                // Lọc ra danh sách các đối tượng thửa đất thực tế khớp với ID đã tìm thấy
                const matchedFeaturesList = allFeatures.filter(f => {
                    const id = f.properties['ID Thửa Đất'] || f.properties['id'] || f.properties['Tên Chủ'];
                    return matchedIds.includes(id);
                });

                if (matchedFeaturesList.length > 0) {
                    // Dùng thư viện Turf.js tạo tập hợp vùng giới hạn (bbox) bao trùm các thửa đất tìm được
                    const fc = turf.featureCollection(matchedFeaturesList);
                    const bbox = turf.bbox(fc);
                    
                    // Lệnh điều khiển bản đồ tự động dịch chuyển và zoom vừa khít các thửa đất đó
                    map.fitBounds(bbox, { padding: 60, maxZoom: 18 });

                    // Bật bảng thông báo số lượng thửa đất tìm được ra màn hình
                    alert(`Đã tìm được ${matchedFeaturesList.length} thửa đất phù hợp với từ khóa "${rawKeyword}"!`);
                } else {
                    // Nếu không có kết quả khớp, báo không tìm thấy
                    alert("Không tìm thấy kết quả phù hợp với từ khóa: " + rawKeyword);
                }
            } catch (err) {
                console.log("Lỗi zoom:", err); // Ghi log nếu xảy ra lỗi ngoại lệ khi zoom
            }
        }, 300); // Độ trễ nhỏ 300 mili-giây để bản đồ kịp cập nhật bộ lọc trước khi zoom
    };

    // Lắng nghe sự kiện khi người dùng gõ phím trong ô tìm kiếm
    searchInput.addEventListener('keydown', (e) => {
        // Nếu phím được bấm là phím "Enter"
        if (e.key === 'Enter') {
            e.preventDefault(); // Chặn hành vi mặc định của phím Enter (như submit form)
            performSearch();     // Gọi hàm thực thi tìm kiếm
        }
    });

    // Lắng nghe sự kiện khi nội dung trong ô input thay đổi
    searchInput.addEventListener('input', (e) => {
        // Nếu người dùng xóa trắng nội dung ô tìm kiếm thì tự động reset bản đồ
        if (e.target.value.trim() === '') {
            performSearch();
        }
    });
}
