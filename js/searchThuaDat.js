// js/searchThuaDat.js

function initThuaDatSearch(map) {
    const searchInput = document.getElementById('searchThuaDatInput');
    if (!searchInput) return;

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

        if (!keyword) {
            if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', ['==', '$type', 'Point']);
            if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', ['==', '$type', 'Point']);
            return;
        }

        // 1. Thu thập dữ liệu từ các source có trên bản đồ
        let allFeatures = [];
        const style = map.getStyle();
        if (style && style.sources) {
            for (const sourceId in style.sources) {
                const src = map.getSource(sourceId);
                if (src && src._data && src._data.features) {
                    allFeatures = allFeatures.concat(src._data.features);
                }
            }
        }

        // Dự phòng lấy từ rendered features nếu source chưa sẵn sàng
        if (allFeatures.length === 0) {
            const rendered = map.queryRenderedFeatures({ layers: ['sheet-thua-dat-fill'] });
            if (rendered) allFeatures = rendered;
        }

        if (allFeatures.length === 0) {
            alert("Dữ liệu bản đồ đang tải, vui lòng chờ 1-2 giây rồi bấm tìm kiếm lại!");
            return;
        }

        // 2. Tiến hành quét tìm kiếm
        const matchedIds = [];
        allFeatures.forEach(f => {
            const props = f.properties || {};
            let combinedText = "";
            for (let key in props) {
                if (props[key]) combinedText += " " + removeAccentsAndLower(props[key]);
            }

            if (combinedText.includes(keyword)) {
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

        if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', finalFilter);
        if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', finalFilter);

        // 4. Tự động thu phóng (zoom) đến khu vực tìm thấy và hiện thông báo số lượng
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

                    // Hiển thị thông báo số lượng thửa đất tìm được
                    alert(`Đã tìm được ${matchedFeaturesList.length} thửa đất của từ khóa "${rawKeyword}"!`);
                } else {
                    alert("Không tìm thấy kết quả phù hợp với từ khóa: " + rawKeyword);
                }
            } catch (err) {
                console.log("Lỗi zoom:", err);
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
