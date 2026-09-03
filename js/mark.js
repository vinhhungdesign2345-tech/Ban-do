// ==========================================
// js/mark.js - QUẢN LÝ TÍNH NĂNG ĐÁNH DẤU ĐỊA ĐIỂM
// ==========================================

let isMarkingMode = false; // Trạng thái bật/tắt chế độ đánh dấu trên bản đồ
let tempMarker = null;     // Biến lưu trữ icon ghim tạm thời khi người dùng click chọn vị trí
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
        
        // TẮT CHẾ ĐỘ GHIM: Tự động xóa hộp thoại nhập tên và ghim tạm nếu đang hiển thị
        const oldPopup = document.getElementById('mark-input-popup');
        if (oldPopup) oldPopup.remove();
        if (tempMarker) {
          tempMarker.remove();
          tempMarker = null;
        }
      }
    };
  }

  // 2. Lắng nghe sự kiện click trên bản đồ khi đang bật chế độ đánh dấu
  map.on('click', (e) => {
    if (!isMarkingMode) return;

    const lng = e.lngLat.lng.toFixed(6);
    const lat = e.lngLat.lat.toFixed(6);
    const coordinatesStr = `${lat}, ${lng}`;

    // Xóa ghim tạm cũ nếu có trước khi tạo ghim tạm mới
    if (tempMarker) {
      tempMarker.remove();
      tempMarker = null;
    }

    // Tạo icon ghim tạm thời ngay vị trí vừa click chuột
    const tempEl = document.createElement('div');
    tempEl.innerHTML = '📍';
    tempEl.style.fontSize = '20px';
    tempEl.style.cursor = 'pointer';

    tempMarker = new maplibregl.Marker({ 
      element: tempEl,
      anchor: 'bottom' // Neo chuẩn ngay chân đáy icon 📍
    })
    .setLngLat([e.lngLat.lng, e.lngLat.lat])
    .addTo(map);

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
  // CẤU HÌNH GIAO DIỆN HỘP THOẠI POPUP
  // ----------------------------------------------------
  popupDiv.style.cssText = `
    position: fixed;                     /* Đặt vị trí cố định trên toàn màn hình cửa sổ */
    bottom: 35px;                        /* Khoảng cách cách mép dưới màn hình 35px */
    left: 50%;                           /* Căn giữa theo chiều ngang từ trái sang 50% */
    transform: translateX(-50%);         /* Dịch chuyển ngược lại 50% chiều rộng để tâm nằm chính giữa ngang */
    background: #ffffff;                 /* Màu nền trắng hiển thị hộp thoại */
    padding: 4px 6px;                    /* Khoảng cách đệm bên trong nhỏ gọn 4px trên/dưới, 6px trái/phải */
    border-radius: 6px;                  /* Độ bo tròn 4 góc của hộp thoại vừa vặn */
    box-shadow: 0 4px 15px rgba(0,0,0,0.3); /* Hiệu ứng đổ bóng đậm tạo chiều nổi khối */
    z-index: 100;                        /* Độ nổi lớp giao diện  */
    width: auto;                         /* Chiều rộng tự động co giãn theo nội dung hàng ngang */
    white-space: nowrap;                 /* Ép toàn bộ nội dung nằm trên một hàng ngang duy nhất không bị xuống dòng */
    font-family: sans-serif;             /* Kiểu font chữ hiển thị chuẩn dễ đọc */
    display: flex;                       /* Sử dụng Flexbox để dàn các phần tử thành hàng ngang */
    align-items: center;                 /* Căn giữa theo chiều dọc các phần tử trong hàng */
    gap: 6px;                            /* Khoảng cách khoảng hở giữa các phần tử là 6px */
  `;
  
  popupDiv.innerHTML = `
    <span style="font-size: 11px; color: #666; font-family: monospace;" title="Tọa độ">${coordinatesStr}</span>
    <input type="text" id="placeNameInput" placeholder="Tên địa điểm..." style="width: 110px; padding: 2px 4px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;" autofocus>
    <button id="saveMarkBtn" style="padding: 2px 6px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">Lưu</button>
    <button id="cancelMarkBtn" style="padding: 2px 6px; background: #ccc; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">Hủy</button>
  `;
  document.body.appendChild(popupDiv);

  // Sự kiện nút Hủy
  document.getElementById('cancelMarkBtn').onclick = () => {
    popupDiv.remove();
    if (tempMarker) {
      tempMarker.remove();
      tempMarker = null;
    }
  };
  
  // Sự kiện nút Lưu đánh dấu
  document.getElementById('saveMarkBtn').onclick = async () => {
    const placeName = document.getElementById('placeNameInput').value.trim();
    if (!placeName) {
      alert('Vui lòng nhập tên địa điểm!');
      return;
    }

    // Lấy ngày cập nhật theo chuẩn định dạng DD.MM.YYYY của dự án (Lưu ý: dùng dấu chấm theo quy ước chung)
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const formattedDate = `${day}.${month}.${year} ${hours}:${minutes}`;

    // Cấu trúc gói dữ liệu gửi lên Google Apps Script
    const payload = {
      action: 'addMark', 
      tenDiaDiem: placeName,
      toaDo: coordinatesStr,
      ngayCapNhat: formattedDate
    };

    const saveBtn = document.getElementById('saveMarkBtn');

    try {
      saveBtn.innerText = 'Lưu...';
      saveBtn.disabled = true;

      // Gửi yêu cầu lưu dữ liệu lên Google Sheet qua Web App
      await fetch(MARK_API_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      alert('Đã lưu địa điểm về Google Sheet thành công!');
      popupDiv.remove();
      
      // Xóa ghim tạm sau khi đã lưu thành công vào Sheet
      if (tempMarker) {
        tempMarker.remove();
        tempMarker = null;
      }
      
      // Tải lại toàn bộ danh sách điểm đánh dấu trên bản đồ để cập nhật điểm mới từ Sheet
      loadSavedMarkers(map);

    } catch (err) {
      console.error('Lỗi khi lưu điểm đánh dấu:', err);
      alert('Có lỗi xảy ra khi lưu dữ liệu!');
    } finally {
      saveBtn.innerText = 'Lưu';
      saveBtn.disabled = false;
    }
  };
}

// ==========================================
// HÀM TẢI DANH SÁCH ĐIỂM TỪ TAB "Đánh dấu" HIỂN THỊ LÊN BẢN ĐỒ
// ==========================================
async function loadSavedMarkers(map) {
  try {
    // Gọi API kèm tham số chỉ định lấy dữ liệu từ tab "Đánh dấu" trong Google Sheet
    const apiGetUrl = `${MARK_API_URL}?sheet=danhdau`;
    const response = await fetch(apiGetUrl);
    const data = await response.json(); 
    
    // Nếu dữ liệu trả về không phải dạng mảng thì dừng lại
    if (!Array.isArray(data)) return;

    // Duyệt qua từng điểm đánh dấu trong danh sách lấy từ Sheet
    data.forEach(item => {
      // Kiểm tra xem dữ liệu có tọa độ hay không
      if (!item.toaDo) return;
      
      // Tách chuỗi tọa độ thành vĩ độ (lat) và kinh độ (lng)
      const parts = item.toaDo.split(',').map(s => parseFloat(s.trim()));
      if (parts.length !== 2) return;
      const [lat, lng] = parts;

      // Kiểm tra tính hợp lệ của tọa độ số
      if (isNaN(lat) || isNaN(lng)) return;

      // Tạo phần tử biểu tượng icon ghim (Marker) hiển thị trên bản đồ MapLibre
      const el = document.createElement('div');
      el.innerHTML = '📍';                  // Biểu tượng icon ghim
      el.style.fontSize = '20px';          // Cỡ chữ của icon
      el.style.cursor = 'pointer';         // Đổi con trỏ chuột thành dạng bấm được

      // Tạo phần tử DOM chứa nội dung popup linh hoạt (hỗ trợ chuyển đổi qua lại giữa chế độ Xem và Sửa)
      const popupContent = document.createElement('div');
      popupContent.style.cssText = 'font-family: sans-serif; font-size: 11px; line-height: 1.3; width: 170px;';

      // ==========================================
      // HÀM CON 1: HIỂN THỊ GIAO DIỆN XEM THÔNG TIN (MẶC ĐỊNH)
      // ==========================================
      const renderViewMode = () => {
        popupContent.innerHTML = `
          <!-- Khối hiển thị Tên địa điểm: In đậm, màu xanh dương chủ đạo -->
          <div style="font-weight: bold; color: #007bff; margin-bottom: 2px;">
            ${item.tenDiaDiem || 'Địa điểm đánh dấu'}
          </div>
          
          <!-- Khối hiển thị Tọa độ: Màu xám đậm, dùng font monospace để thẳng hàng số -->
          <div style="color: #555; font-family: monospace; margin-bottom: 6px;">
            ${item.toaDo}
          </div>
          
          <!-- Hàng chứa 2 nút chức năng Sửa và Xóa nằm hai bên -->
          <div style="display: flex; justify-content: space-between;">
            <button class="edit-mark-btn" style="background: #ffc107; color: #333; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 10px; font-weight: bold;">Sửa</button>
            <button class="delete-mark-btn" style="background: #dc3545; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 10px;">Xóa</button>
          </div>
        `;

        // Bắt sự kiện khi người dùng bấm nút "Sửa" -> Chuyển sang giao diện nhập tên mới
        popupContent.querySelector('.edit-mark-btn').onclick = () => {
          renderEditMode();
        };

        // Bắt sự kiện khi người dùng bấm nút "Xóa" trong popup
        popupContent.querySelector('.delete-mark-btn').onclick = async () => {
          if (!confirm(`Bạn có chắc muốn xóa địa điểm "${item.tenDiaDiem || item.toaDo}" này không?`)) return;

          // Cấu trúc gói dữ liệu gửi lệnh xóa lên Google Apps Script
          const payload = {
            action: 'deleteMark', 
            toaDo: item.toaDo
          };

          const deleteBtn = popupContent.querySelector('.delete-mark-btn');
          try {
            deleteBtn.innerText = 'Đang xóa...';
            deleteBtn.disabled = true;

            // Gửi yêu cầu xóa lên Google Sheet qua Web App
            await fetch(MARK_API_URL, {
              method: 'POST',
              mode: 'no-cors', 
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            alert('Đã gửi yêu cầu xóa điểm đánh dấu!');
            popup.remove(); // Đóng khung popup hiện tại
            
            // Tải lại toàn bộ danh sách điểm trên bản đồ để cập nhật trạng thái mới nhất
            loadSavedMarkers(map);

          } catch (err) {
            console.error('Lỗi khi xóa điểm đánh dấu:', err);
            alert('Có lỗi xảy ra khi xóa dữ liệu!');
            deleteBtn.innerText = 'Xóa';
            deleteBtn.disabled = false;
          }
        };
      };

      // ==========================================
      // HÀM CON 2: HIỂN THỊ GIAO DIỆN CHỈNH SỬA TÊN ĐỊA ĐIỂM
      // ==========================================
      const renderEditMode = () => {
        popupContent.innerHTML = `
          <!-- Ô nhập văn bản để thay đổi tên địa điểm mới -->
          <div style="margin-bottom: 4px;">
            <input type="text" class="edit-input" value="${item.tenDiaDiem || ''}" placeholder="Nhập tên mới..." style="width: 100%; padding: 2px 4px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;" autofocus>
          </div>
          
          <!-- Tọa độ tĩnh phía dưới ô nhập tên -->
          <div style="color: #555; font-family: monospace; margin-bottom: 6px;">
            ${item.toaDo}
          </div>
          
          <!-- Hàng chứa 2 nút Lưu và Hủy chỉnh sửa -->
          <div style="display: flex; justify-content: flex-end; gap: 4px;">
            <button class="save-edit-btn" style="background: #28a745; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 10px;">Lưu</button>
            <button class="cancel-edit-btn" style="background: #ccc; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 10px;">Hủy</button>
          </div>
        `;

        // Tự động trỏ con trỏ chuột và bôi đen toàn bộ chữ trong ô input để gõ nhanh hơn
        const input = popupContent.querySelector('.edit-input');
        input.focus();
        input.select();

        // Bắt sự kiện bấm nút "Hủy" -> Quay lại chế độ xem thông tin bình thường
        popupContent.querySelector('.cancel-edit-btn').onclick = () => {
          renderViewMode();
        };

        // Bắt sự kiện bấm nút "Lưu" -> Gửi dữ liệu cập nhật tên mới lên Google Sheet
        popupContent.querySelector('.save-edit-btn').onclick = async () => {
          const newName = input.value.trim();
          const saveBtn = popupContent.querySelector('.save-edit-btn');
          
          // Cấu trúc gói dữ liệu gửi lệnh cập nhật lên Google Apps Script
          const payload = { 
            action: 'updateMark', 
            toaDo: item.toaDo,     // Dùng tọa độ làm khóa chính để tìm đúng dòng cần sửa
            tenDiaDiem: newName    // Tên địa điểm mới do người dùng vừa nhập
          };

          try {
            saveBtn.innerText = 'Đang lưu...';
            saveBtn.disabled = true;

            // Gửi yêu cầu cập nhật lên Google Sheet qua Web App
            await fetch(MARK_API_URL, {
              method: 'POST',
              mode: 'no-cors', 
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            alert('Đã cập nhật tên địa điểm thành công!');
            popup.remove(); // Đóng khung popup hiện tại
            loadSavedMarkers(map); // Tải lại danh sách trên bản đồ

          } catch (err) {
            console.error('Lỗi khi cập nhật tên địa điểm:', err);
            alert('Có lỗi xảy ra khi lưu dữ liệu!');
            saveBtn.innerText = 'Lưu';
            saveBtn.disabled = false;
          }
        };
      };

      // Khởi chạy chế độ hiển thị xem thông tin (mặc định ban đầu khi click vào ghim)
      renderViewMode();

      // Khởi tạo đối tượng Popup của MapLibre với các thông số tối ưu giao diện
      const popup = new maplibregl.Popup({ 
        offset: 25,          // Khoảng cách hở theo chiều dọc so với chân icon ghim
        maxWidth: '180px',   // Giới hạn chiều rộng tối đa của khung popup
        closeButton: false   // Tắt nút 'x' mặc định vì người dùng có thể click ra ngoài để đóng
      }).setDOMContent(popupContent);

      // Tạo đối tượng Marker và gắn lên bản đồ MapLibre
      new maplibregl.Marker({ 
        element: el,         // Sử dụng phần tử icon tùy chỉnh
        anchor: 'bottom'     // Neo chuẩn ở chân/đáy của icon để trùng khít tọa độ click
      })
        .setLngLat([lng, lat]) // Thiết lập tọa độ vị trí ghim
        .setPopup(popup)       // Gắn popup chứa thông tin, nút sửa/xóa vào marker
        .addTo(map);           // Thêm marker chính thức lên bản đồ
    });
  } catch (err) {
    console.error('Không thể tải danh sách điểm đánh dấu từ Google Sheet:', err);
  }
}
