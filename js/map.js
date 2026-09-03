// ==========================================
// js/map.js - QUẢN LÝ BẢN ĐỒ MAPLIBRE VÀ TƯƠNG TÁC
// ==========================================

// --- KHAI BÁO BIẾN TOÀN CỤC QUẢN LÝ NHÃN SỐ ĐO CẠNH VÀ ID THỬA ĐẤT ---
let activeMarkers = []; // Mảng lưu trữ danh sách các đối tượng Marker hiển thị số đo kích thước cạnh thửa đất trên bản đồ
window.selectedThuaDatId = null; // Biến toàn cục lưu trữ ID của thửa đất đang được click chọn

// ==========================================
// HÀM XÓA SẠCH CÁC NHÃN SỐ ĐO CẠNH TRÊN BẢN ĐỒ
// ==========================================
function clearLengthMarkers() {
  // Duyệt qua mảng activeMarkers và gỡ bỏ từng marker hiển thị chiều dài cạnh khỏi bản đồ
  activeMarkers.forEach(marker => marker.remove());
  activeMarkers = []; // Reset mảng về rỗng
}

// ==========================================
// HÀM ĐỊNH DẠNG SỐ CHUẨN VIỆT NAM (HỖ TRỢ GIỮ NGUYÊN SỐ THỰC)
// ==========================================
function formatNumberVN(val) {
  // Kiểm tra nếu giá trị rỗng, null hoặc dấu gạch ngang thì trả về nguyên bản
  if (val === null || val === undefined || val === '' || val === '-') return '-';
  
  // Thay thế dấu phẩy thành dấu chấm để chuẩn hóa chuỗi số JavaScript
  const stringVal = String(val).replace(',', '.');
  const num = parseFloat(stringVal);
  
  // Nếu không phải là số hợp lệ thì trả về giá trị cũ
  if (isNaN(num)) return val;

  // Định dạng lại số theo chuẩn Việt Nam (phân cách hàng nghìn, tối đa 2 chữ số thập phân)
  return num.toLocaleString('vi-VN', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 2 
  });
}

// ==========================================
// HÀM ĐÓNG BẢNG THÔNG TIN VÀ XÓA TRẠNG THÁI LÀM NỔI BẬT THỬA ĐẤT
// ==========================================
function closeParcelPanel() {
  const panel = document.getElementById('parcel-info-panel');
  
  // Ẩn bảng hiển thị thông tin chi tiết thửa đất ở giao diện
  if (panel) panel.style.display = 'none';

  // Đặt lại ID thửa đất được chọn về null
  window.selectedThuaDatId = null;

  // Xóa các nhãn đo cạnh của thửa đất cũ
  clearLengthMarkers();

  const mapInstance = window.currentMapInstance;
  if (mapInstance) {
    // Xóa hiệu ứng làm nổi bật phần nền (fill) của thửa đất trên bản đồ
    if (mapInstance.getLayer('sheet-thua-dat-highlight-fill')) {
      mapInstance.setFilter('sheet-thua-dat-highlight-fill', ['==', ['get', 'ID Thửa Đất'], '']);
    }
    
    // Xóa hiệu ứng làm nổi bật phần đường viền (line) của thửa đất trên bản đồ
    if (mapInstance.getLayer('sheet-thua-dat-highlight-line')) {
      mapInstance.setFilter('sheet-thua-dat-highlight-line', ['==', ['get', 'ID Thửa Đất'], '']);
    }

    // Làm sạch nguồn dữ liệu vẽ kích thước cạnh thửa đất
    if (mapInstance.getSource('parcel-dimensions-source')) {
      mapInstance.getSource('parcel-dimensions-source').setData({
        type: 'FeatureCollection',
        features: [] 
      });
    }
  }
}

// ==========================================
// HÀM KHỞI TẠO VÀ CẤU HÌNH TOÀN BỘ BẢN ĐỒ
// ==========================================
function initMap() {
  // Khởi tạo đối tượng bản đồ MapLibre GL bên trong thẻ div có id là 'map'
  const map = new maplibregl.Map({
    container: 'map', 
    style: CONFIG.MAP_STYLE, // Lấy style cấu hình từ tệp cấu hình chung
    center: CONFIG.MAP_CENTER, // Tọa độ trung tâm mặc định khi mở bản đồ
    zoom: CONFIG.MAP_ZOOM // Mức phóng to (zoom) mặc định
  });

  // Lưu lại instance của bản đồ vào biến toàn cục để các hàm khác có thể gọi chung
  window.currentMapInstance = map;

  // Tạo công cụ định vị vị trí người dùng trên bản đồ
  const geolocate = new maplibregl.GeolocateControl({
    positionOptions: { 
      enableHighAccuracy: true, 
      maximumAge: 0, 
      timeout: 20000 
    },
    trackUserLocation: true, 
    showUserHeading: true 
  });
  
  // Thêm nút định vị vào góc trên bên phải bản đồ
  map.addControl(geolocate, 'top-right');

  // Sự kiện xảy ra khi định vị thành công vị trí hiện tại của người dùng
  geolocate.on('geolocate', async (position) => {
    const lng = position.coords.longitude; 
    const lat = position.coords.latitude; 

    // Nếu hàm lấy Phường/Xã từ tọa độ tồn tại thì gọi để tự động tra cứu khu vực
    if (typeof selectPhuongFromPoint === 'function') {
      await selectPhuongFromPoint(lng, lat, map);
    }
  });

  // Sự kiện khi bản đồ đã tải hoàn tất toàn bộ tài nguyên cốt lõi
  map.on('load', () => {
    const satLayer = 'google-satellite-layer'; // ID lớp bản đồ vệ tinh
    const osmLayer = 'osm-layer'; // ID lớp bản đồ OpenStreetMap

    // Mặc định bật lớp vệ tinh và ẩn lớp OSM khi mới vào trang
    map.setLayoutProperty(satLayer, 'visibility', 'visible');
    map.setLayoutProperty(osmLayer, 'visibility', 'none');

    // Cấu hình nút chuyển đổi qua lại giữa bản đồ Vệ tinh và OSM
    const toggleBtn = document.getElementById('toggleLayerBtn');
    if (toggleBtn) {
      toggleBtn.innerText = 'Chuyển sang Bản đồ OSM';

      toggleBtn.onclick = function() {
        const isSatVisible = map.getLayoutProperty(satLayer, 'visibility') === 'visible';
        
        if (isSatVisible) {
          // Nếu đang là vệ tinh thì chuyển sang OSM
          map.setLayoutProperty(satLayer, 'visibility', 'none');
          map.setLayoutProperty(osmLayer, 'visibility', 'visible');
          this.innerText = 'Chuyển sang Bản đồ Vệ tinh';
        } else {
          // Nếu đang là OSM thì chuyển về vệ tinh
          map.setLayoutProperty(satLayer, 'visibility', 'visible');
          map.setLayoutProperty(osmLayer, 'visibility', 'none');
          this.innerText = 'Chuyển sang Bản đồ OSM';
        }
      };
    }

    // Cấu hình thanh kéo (slider) điều chỉnh độ mờ/đậm (opacity) của lớp bản đồ thửa đất
    const opacitySlider = document.getElementById('opacitySlider');
    const opacityValueLabel = document.getElementById('opacityValue');

    if (opacitySlider) {
      opacitySlider.oninput = function() {
        const val = parseFloat(this.value);
        if (opacityValueLabel) opacityValueLabel.innerText = val;

        // Thay đổi độ mờ của lớp nền thửa đất thông thường
        if (map.getLayer('sheet-thua-dat-fill')) {
          map.setPaintProperty('sheet-thua-dat-fill', 'fill-opacity', val);
        }
        
        // Thay đổi độ mờ của thửa đất đang được chọn (highlight) cho đậm hơn một chút
        if (map.getLayer('sheet-thua-dat-highlight-fill')) {
          map.setPaintProperty('sheet-thua-dat-highlight-fill', 'fill-opacity', Math.min(val + 0.2, 1.0));
        }
      };
    }

    // Khởi tạo nguồn dữ liệu và giao diện layer hiển thị kích thước các cạnh thửa đất
    if (!map.getSource('parcel-dimensions-source')) {
      map.addSource('parcel-dimensions-source', {
        type: 'geojson',
        data: { 
          type: 'FeatureCollection', 
          features: [] 
        }
      });

      map.addLayer({
        id: 'parcel-dimensions-layer',
        type: 'circle',
        source: 'parcel-dimensions-source',
        paint: {
          'circle-radius': 4, 
          'circle-color': '#ffffff', 
          'circle-stroke-width': 1.5, 
          'circle-stroke-color': '#000000'
        }
      });
    }

    // Khởi tạo tính năng đo đạc khoảng cách/diện tích chuyên dụng từ tệp measure.js
    if (typeof initMeasureFeature === 'function') {
      initMeasureFeature(map);
    }

    // Khởi tạo tính năng đánh dấu tọa độ địa điểm chuyên dụng từ tệp mark.js
    if (typeof initMarkFeature === 'function') {
      initMarkFeature(map);
    }

    // Gọi các hàm khởi tạo bộ lọc và tìm kiếm thửa đất
    initFilter(map);
    initThuaDatSearch(map);
  });

  // ==========================================
  // SỰ KIỆN CẬP NHẬT TỌA ĐỘ VỊ TRÍ CHUỘT
  // ==========================================
  map.on('mousemove', (e) => {
    // Tìm hoặc tự tạo thẻ hiển thị tọa độ ghim cố định ở góc dưới bên trái
    let coordDisplay = document.getElementById('coordinate-display');
    if (!coordDisplay) {
      coordDisplay = document.createElement('div');
      coordDisplay.id = 'coordinate-display';
      
      // ----------------------------------------------------
      // CẤU HÌNH GIAO DIỆN HỘP TỌA ĐỘ (ĐÃ TÁCH DÒNG & CHÚ THÍCH CHI TIẾT)
      // ----------------------------------------------------
      coordDisplay.style.cssText = `
        position: absolute !important;     /* Đặt vị trí tuyệt đối so với khung chứa bản đồ */
        bottom: 45px !important;           /* Khoảng cách cách đáy bản đồ lên cao 45px */
        left: 10px !important;             /* Khoảng cách cách lề trái đúng 10px */
        background: rgba(0, 0, 0, 0.9);    /* Nêền đen có độ trong suốt nhẹ 90% */
        padding: 4px 8px;                  /* Khoảng cách đệm bên trong (trên/dưới 4px, trái/phải 8px) */
        font-size: 11px;                   /* Kích thước chữ hiển thị nhỏ gọn */
        font-family: monospace;            /* Kiểu font chữ dạng đơn không gian giúp căn số thẳng hàng */
        border-radius: 4px;                /* Độ bo tròn 4 góc của khung */
        box-shadow: 0 1px 3px rgba(0,0,0,0.2); /* Hiệu ứng đổ bóng mờ nhẹ tạo chiều sâu */
        text-align: center;                /* Căn lề chữ ra giữa khung */
        font-weight: bold;                 /* Định dạng chữ in đậm */
        color: #333;                       /* Màu chữ xám đậm dễ nhìn */
        z-index: 1000;                     /* Độ nổi lớp giao diện (luôn nằm trên các thành phần khác) */
        margin: 0 !important;              /* Triệt tiêu khoảng cách lề ngoài mặc định */
      `;
      
      // Đưa thẳng vào thẻ chứa bản đồ để nó đứng độc lập, không bị phụ thuộc vào nút bấm nào khác
      const mapContainer = document.getElementById('map');
      if (mapContainer) {
        mapContainer.appendChild(coordDisplay);
      } else {
        document.body.appendChild(coordDisplay);
      }
    }

    // Lấy tọa độ vĩ độ và kinh độ theo chuẩn 6 chữ số thập phân
    const lat = e.lngLat.lat.toFixed(6); 
    const lng = e.lngLat.lng.toFixed(6); 
    coordDisplay.innerText = `${lat}, ${lng}`; // Hiển thị chuẩn định dạng yêu cầu
  });

  // Xóa nội dung hiển thị tọa độ khi con trỏ chuột rời khỏi vùng bản đồ
  map.on('mouseout', () => {
    const coordDisplay = document.getElementById('coordinate-display');
    if (coordDisplay) {
      coordDisplay.innerText = '';
    }
  });

  // Mảng chứa ID các lớp (layer) của thửa đất trên bản đồ cần lắng nghe sự kiện click
  const sheetLayers = ['sheet-thua-dat-fill', 'sheet-thua-dat-line'];
  let isFeatureClicked = false; // Biến cờ kiểm tra xem có click trúng thửa đất hay không

  sheetLayers.forEach(layerId => {
    // Sự kiện khi người dùng click chuột vào một thửa đất trên bản đồ
    map.on('click', layerId, (e) => {
      // Nếu đang trong chế độ đo đạc tự do hoặc chế độ đánh dấu thì bỏ qua sự kiện click chọn thửa đất
      if (isMeasuring || (typeof isMarkingMode !== 'undefined' && isMarkingMode)) return; 

      if (!e.features || !e.features.length) return;
      isFeatureClicked = true; // Đánh dấu là đã click trúng thửa đất

      const selectedFeature = e.features[0]; // Lấy đối tượng thửa đất đầu tiên được click
      const rawProps = selectedFeature.properties || {}; // Trích xuất toàn bộ thuộc tính dữ liệu từ Google Sheet gắn với thửa đất

      window._currentParcelRawProps = rawProps;

      const parcelId = rawProps['ID Thửa Đất'] || rawProps['id'] || '';
      window.selectedThuaDatId = parcelId;

      // Xóa các nhãn đo chiều dài cạnh cũ trước khi vẽ nhãn mới của thửa đất này
      clearLengthMarkers();

      // Sử dụng thư viện Turf.js để tính toán chiều dài các cạnh của đa giác thửa đất
      if (typeof turf !== 'undefined' && selectedFeature.geometry) {
        try {
          const lineSegments = turf.lineSegment(selectedFeature); // Tách đa giác thành các đoạn thẳng đơn lẻ
          const dimensionFeatures = [];

          // Duyệt qua từng đoạn thẳng cạnh của thửa đất
          lineSegments.features.forEach(segment => {
            const lengthMeters = turf.length(segment, { units: 'meters' }); // Tính chiều dài theo mét
            
            // Làm tròn số đo cạnh (dưới 10m lấy 2 số thập phân, trên 10m lấy 1 số thập phân)
            const formattedLength = lengthMeters >= 10 
              ? `${lengthMeters.toFixed(1)}m` 
              : `${lengthMeters.toFixed(2)}m`;

            segment.properties.length = formattedLength;
            dimensionFeatures.push(segment);

            // Tính toán điểm giữa (midpoint) của cạnh để đặt nhãn hiển thị số đo
            const coords = segment.geometry.coordinates;
            const midCoord = [(coords[0][0] + coords[1][0]) / 2, (coords[0][1] + coords[1][1]) / 2];

            // Tạo phần tử HTML chứa nhãn hiển thị kích thước cạnh
            const el = document.createElement('div');
            el.style.color = '#ffffff'; 
            el.style.fontSize = '12px'; 
            el.style.fontWeight = 'Bold'; 
            el.style.textShadow = '1px 1px 2px #000000, -1px -1px 2px #000000, 1px -1px 2px #000000, -1px 1px 2px #000000'; 
            el.style.whiteSpace = 'nowrap'; 
            el.innerText = formattedLength; 

            // Tạo Marker của MapLibre để ghim nhãn số đo lên tọa độ điểm giữa cạnh
            const marker = new maplibregl.Marker({
              element: el,
              anchor: 'center'
            })
            .setLngLat(midCoord) 
            .addTo(map); 

            activeMarkers.push(marker); // Thêm vào mảng quản lý để tiện xóa sau này
          });

          // Cập nhật nguồn dữ liệu vẽ các điểm/đường kích thước cạnh
          if (map.getSource('parcel-dimensions-source')) {
            map.getSource('parcel-dimensions-source').setData({
              type: 'FeatureCollection',
              features: dimensionFeatures
            });
          }
        } catch (err) {
          console.error("Lỗi trong quá trình tính toán độ dài cạnh thửa đất:", err);
        }
      }

      // Trích xuất các thông tin chi tiết từ thuộc tính Google Sheet để hiển thị lên bảng thông tin
      const soTo = rawProps['Số tờ'] || rawProps['So to'] || '-';
      const soThua = rawProps['Số thửa'] || rawProps['So thua'] || '-';
      
      const rawDienTich = rawProps['Diện tích'] || 
        rawProps['Dien tich'] || 
        rawProps['dien_tich'] || 
        rawProps['DienTich'] || 
        rawProps['DIỆN TÍCH'] || 
        rawProps['Diện tích\nm²'] || 
        rawProps['Diện\ntích'] || '-';
      
      const dienTich = formatNumberVN(rawDienTich); // Định dạng lại diện tích theo chuẩn Việt Nam

      const loaiDat = rawProps['Loại Đất'] || rawProps['Loại Đất:'] || rawProps['Loại đất'] || rawProps['loai_dat'] || '-';
      const tenChu = rawProps['Tên Chủ'] || rawProps['Tên chủ'] || '-';
      const soDinhDanh = rawProps['Số định danh chủ đất'] || rawProps['Số định danh'] || 'Không có';
      
      // Xử lý logic hiển thị nút Xem/Nhập dữ liệu cho cột ghi chú phụ (Cột N)
      const columnNValue = rawProps['Cột N'] || rawProps['cot_n'] || rawProps['Ghi Chú'] || rawProps['Ghi chú'] || '';
      let columnNLinkHTML = '';

      if (columnNValue && columnNValue.trim() !== '' && columnNValue !== 'Không có') {
        window[`_viewColN_${parcelId}`] = () => openColumnNPopup(parcelId, 'view', columnNValue);
        columnNLinkHTML = `<a href="javascript:void(0);" onclick="window._viewColN_${parcelId}();" style="color: #007bff; text-decoration: underline; font-weight: bold;">Xem</a>`;
      } else {
        window[`_inputColN_${parcelId}`] = () => openColumnNPopup(parcelId, 'input', '');
        columnNLinkHTML = `<a href="javascript:void(0);" onclick="window._inputColN_${parcelId}();" style="color: #d93025; text-decoration: underline; font-weight: bold;">Nhập</a>`;
      }

      // Thiết lập bộ lọc để làm nổi bật (highlight) thửa đất vừa click trên bản đồ
      let selectFilter = parcelId ? ['==', ['get', 'ID Thửa Đất'], rawProps['ID Thửa Đất'] || parcelId] : ['==', ['get', 'Tên Chủ'], tenChu];

      if (map.getLayer('sheet-thua-dat-highlight-fill')) map.setFilter('sheet-thua-dat-highlight-fill', selectFilter);
      if (map.getLayer('sheet-thua-dat-highlight-line')) map.setFilter('sheet-thua-dat-highlight-line', selectFilter);

      // Xây dựng cấu trúc HTML nội dung hiển thị trong bảng thông tin chi tiết thửa đất
      const panelContent = `
        <div><b>Số tờ:</b> ${soTo}</div>
        <div><b>Số thửa:</b> ${soThua}</div>
        <div><b>Diện tích:</b> ${dienTich} m²</div>
        <div><b>Loại đất:</b> ${loaiDat}</div>
        <div style="grid-column: span 2;"><b>Tên chủ:</b> ${tenChu}</div>
        <div><b>Số định danh:</b> ${soDinhDanh}</div>
        <div><b>Ghi chú:</b> ${columnNLinkHTML}</div>
      `;

      // Đưa nội dung vào khung giao diện và hiển thị bảng thông tin lên màn hình
      const panelContentEl = document.getElementById('panel-content');
      const panelEl = document.getElementById('parcel-info-panel');
      if (panelContentEl) panelContentEl.innerHTML = panelContent;
      if (panelEl) panelEl.style.display = 'block'; 
    });

    // Cấu hình đổi kiểu con trỏ chuột khi di chuyển qua lại trên ranh giới thửa đất
    map.on('mouseenter', layerId, () => map.getCanvas().style.cursor = 'default');
    map.on('mouseleave', layerId, () => map.getCanvas().style.cursor = 'default');
  });

  // Sự kiện click trực tiếp lên nền bản đồ (vùng trống không có thửa đất)
  map.on('click', (e) => {
    // Nếu đang trong chế độ đo đạc (measure) thì xử lý nhận tọa độ điểm đo
    if (isMeasuring) {
      if (window._isDraggingMarker) return;

      const coords = [e.lngLat.lng, e.lngLat.lat];
      
      // Kiểm tra nếu click gần điểm bắt đầu (dưới 5 mét) thì tự động đóng kín đa giác đo đạc
      if (measureCoordinates.length >= 2 && typeof turf !== 'undefined') {
        const firstCoord = measureCoordinates[0];
        const distanceToFirst = turf.distance(
          turf.point(firstCoord),
          turf.point(coords),
          { units: 'meters' }
        );
        
        if (distanceToFirst < 5) {
          pushMeasureState();
          measureCoordinates.push([...firstCoord]);
          updateMeasureGeometry(map, false);
          return;
        }
      }

      pushMeasureState();
      measureCoordinates.push(coords);
      updateMeasureGeometry(map, false);
      return;
    }

    // Nếu click vào khoảng trắng ngoài thửa đất thì đóng bảng thông tin và thực hiện tra cứu vị trí hành chính (Phường/Xã)
    if (!isFeatureClicked) {
      closeParcelPanel(); 

      if (typeof selectPhuongFromPoint === 'function') {
        selectPhuongFromPoint(e.lngLat.lng, e.lngLat.lat, map);
      }
    }
    isFeatureClicked = false; 
  });
}

// Gọi hàm khởi tạo bản đồ ngay khi tài liệu HTML tải xong hoàn toàn
document.addEventListener('DOMContentLoaded', initMap);
