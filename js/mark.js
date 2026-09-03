// ==========================================
// js/mark.js - QUẢN LÝ TÍNH NĂNG ĐÁNH DẤU ĐỊA ĐIỂM
// ==========================================

let isMarkingMode = false; // Trạng thái bật/tắt chế độ đánh dấu trên bản đồ
const MARK_API_URL = 'https://script.google.com/macros/s/AKfycbz87dcUkndM5w5BeFqUFYJt8JDEcPu98IH5mbzNdov_6eXTNUEhIiknFQ9P7H2c0ZQE/exec';

// ==========================================
// HÀM KHỞI TẠO TÍNH NĂNG ĐÁNH DẤU
// ==========================================
function initMarkFeature(map) {
  // 1. Tạo nút đánh dấu nằm chung cụm góc trên bên phải (dưới nút định vị)
  const topRightContainer = document.querySelector('.maplibregl-ctrl-top-right');
  
  if (topRightContainer) {
    const markControlDiv = document.createElement('div');
    markControlDiv.className = 'maplibregl-ctrl maplibregl-ctrl-group';
    markControlDiv.innerHTML = `
      <button id="toggleMarkBtn" type="button" title="Bật/Tắt chế độ đánh dấu địa điểm" style="background: white; border: none; cursor: pointer; width: 29px; height: 29px; display: flex; align-items: center; justify-content: center; font-size: 16px;">
        📍
      </button>
    `;
    topRightContainer.appendChild(markControlDiv);

    // Sự kiện click bật/tắt chế độ đánh dấu
    document.getElementById('toggleMarkBtn').onclick = function() {
      isMarkingMode = !isMarkingMode;
      if (isMarkingMode) {
        this.style.background = '#e0f0ff';
        this.style.border = '2px solid #007bff';
        map.getCanvas().style.cursor = 'crosshair';
      } else {
        this.style.background = 'white';
        this.style.border = 'none';
        map.getCanvas().style.cursor = '';
      }
    };
  }

  // 2. Lắng nghe sự kiện click trên bản đồ khi đang bật chế độ đánh dấu
  map.on('click', (e) => {
    if (!isMarkingMode) return;

    const lng = e.lngLat.lng.toFixed(6);
    const lat = e.lngLat.lat.toFixed(6);
    const coordinatesStr = `${lat}, ${lng}`;

    // Hiển thị hộp thoại nhỏ cho phép người dùng nhập tên địa điểm
    openMarkPrompt(coordinatesStr, map, { lng: e.lngLat.lng, lat: e.lngLat.lat });
  });

  // 3. Tải và hiển thị các điểm đánh dấu đã lưu từ tab "Đánh dấu" trên Google Sheet lên bản đồ
  loadSavedMarkers(map);
}

// ==========================================
// HÀM MỞ HỘP THOẠI NHẬP TÊN ĐỊA ĐIỂM
// ==========================================
function openMarkPrompt(coordinatesStr, map, lngLatObj) {
  // Xóa hộp thoại cũ nếu đang tồn tại trên giao diện
  const oldPopup = document.getElementById('mark-input-popup');
  if (oldPopup) oldPopup.remove();

  const popupDiv = document.createElement('div');
  popupDiv.id = 'mark-input-popup';
  
  // ----------------------------------------------------
  // CẤU HÌNH GIAO DIỆN HỘP THOẠI POPUP (SIÊU GỌN)
  // ----------------------------------------------------
  popupDiv.style.cssText = `
    position: absolute !important;        /* Đặt vị trí tuyệt đối so với khung chứa bản đồ */
    bottom: 45px !important;              /* Khoảng cách cách đáy bản đồ lên cao đúng 45px */
    left: 10px !important;                /* Khoảng cách cách lề trái 10px cho gọn gàng */
    background: #ffffff;                  /* Màu nền trắng hiển thị hộp thoại */
    padding: 3px;                         /* Khoảng cách đệm bên trong siêu nhỏ gọn chỉ 3px */
    border-radius: 6px;                   /* Độ bo tròn 4 góc của hộp thoại */
    box-shadow: 0 4px 15px rgba(0,0,0,0.3); /* Hiệu ứng đổ bóng đậm tạo chiều nổi khối */
    z-index: 10000;                       /* Độ nổi lớp giao diện cao nhất, đè lên mọi thành phần khác */
    width: 150px;                         /* Chiều rộng cố định rút gọn còn 150px */
    font-family: sans-serif;              /* Kiểu font chữ hiển thị chuẩn dễ đọc */
  `;
  
  popupDiv.innerHTML = `
    <h3 style="margin: 2px 0; font-size: 13px; color: #333;">Đánh dấu địa điểm</h3>
    <p style="font-size: 11px; color: #666; margin: 2px 0 6px 0;">Tọa độ: <b>${coordinatesStr}</b></p>
    <input type="text" id="placeNameInput" placeholder="Nhập tên..." style="width: 100%; padding: 4px 6px; box-sizing: border-box; margin-bottom: 6px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;" autofocus>
    <div style="text-align: right;">
      <button id="cancelMarkBtn" style="padding: 2px 6px; margin-right: 3px; background: #ccc; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">Hủy</button>
      <button id="saveMarkBtn" style="padding: 2px 6px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">Lưu</button>
    </div>
  `;
  
  // Đưa thẳng vào thẻ chứa bản đồ để cố định vị trí theo mép bản đồ
  const mapContainer = document.getElementById('map');
  if (mapContainer) {
    mapContainer.appendChild(popupDiv);
  } else {
    document.body.appendChild(popupDiv);
  }

  // Sự kiện nút Hủy
  document.getElementById('cancelMarkBtn').onclick = () => popupDiv.remove();
  
  // Sự kiện nút Lưu đánh dấu
  document.getElementById('saveMarkBtn').onclick = async () => {
    const placeName = document.getElementById('placeNameInput').value.trim();
    if (!placeName) {
      alert('Vui lòng nhập tên địa điểm!');
      return;
    }

    // Lấy ngày cập nhật theo chuẩn định dạng DD.MM.YYYY của dự án
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const formattedDate = `${day}.${month}.${year} ${hours}:${minutes}`;
  };
}

    // ==========================================
    // CẤU TRÚC GÓI DỮ LIỆU (PAYLOAD) GỬI LÊN GOOGLE APPS SCRIPT
    // ==========================================
    const payload = {
      
      // Hành động yêu cầu xử lý phía server (Xác định đây là lệnh lưu điểm đánh dấu)
      action: 'addMark', 
      
      // Tên của địa điểm do người dùng nhập vào từ ô input
      tenDiaDiem: placeName,
      
      // Chuỗi tọa độ vị trí vừa click trên bản đồ (Định dạng: "Latitude, Longitude")
      toaDo: coordinatesStr,
      
      // Thời điểm thực hiện đánh dấu hoặc cập nhật (Định dạng chuẩn DD.MM.YYYY HH:mm)
      ngayCapNhat: formattedDate
      
    };

    const saveBtn = document.getElementById('saveMarkBtn');

    try {
      saveBtn.innerText = 'Đang lưu...';
      saveBtn.disabled = true;

      // Gửi yêu cầu lưu dữ liệu lên Google Sheet qua Web App
      await fetch(MARK_API_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload)
      });

      alert('Đã lưu địa điểm về Google Sheet thành công!');
      popupDiv.remove();
      
      // Tải lại toàn bộ danh sách điểm đánh dấu trên bản đồ để hiển thị ngay lập tức điểm mới
      loadSavedMarkers(map);

    } catch (err) {
      console.error('Lỗi khi lưu điểm đánh dấu:', err);
      alert('Có lỗi xảy ra khi lưu dữ liệu!');
    } finally {
      saveBtn.innerText = 'Đánh dấu';
      saveBtn.disabled = false;
    }
  };
}

// ==========================================
// HÀM TẢI DANH SÁCH ĐIỂM TỪ TAB "Đánh dấu" HIỂN THỊ LÊN BẢN ĐỒ
// ==========================================
async function loadSavedMarkers(map) {
  try {
    // Gọi API kèm theo tham số chỉ định lấy dữ liệu chính xác từ tab "Đánh dấu"
    const apiGetUrl = `${MARK_API_URL}?sheet=danhdau`;
    const response = await fetch(apiGetUrl);
    const data = await response.json(); 
    
    if (!Array.isArray(data)) return;

    data.forEach(item => {
      if (!item.toaDo) return;
      const parts = item.toaDo.split(',').map(s => parseFloat(s.trim()));
      if (parts.length !== 2) return;
      const [lat, lng] = parts;

      if (isNaN(lat) || isNaN(lng)) return;

      // Tạo phần tử biểu tượng Marker hiển thị trên bản đồ MapLibre
      const el = document.createElement('div');
      el.innerHTML = '📌';
      el.style.fontSize = '20px';
      el.style.cursor = 'pointer';

      // Tạo khung thông tin chi tiết (Popup) hiển thị khi click vào marker trên bản đồ
      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div style="font-family: sans-serif;">
          <b>${item.tenDiaDiem || 'Địa điểm đánh dấu'}</b><br>
          <span style="font-size: 11px; color: #666;">Tọa độ: ${item.toaDo}</span><br>
          <span style="font-size: 11px; color: #666;">Cập nhật: ${item.ngayCapNhat || ''}</span>
        </div>
      `);

      // Thêm Marker lên bản đồ MapLibre tại tọa độ Longitude, Latitude đã lấy
      new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);
    });
  } catch (err) {
    console.error('Không thể tải danh sách điểm đánh dấu từ Google Sheet:', err);
  }
}
