/**
 * Mô-đun: Trích xuất dữ liệu từ sheet "Giá đất", liên kết theo Phường/Xã và Tuyến đường
 * Trả kết quả trực tiếp lên khung panel trên màn hình bản đồ.
 */
document.addEventListener("DOMContentLoaded", function () {
    const phuongSelect = document.getElementById("phuongFilter");
    const duongSelect = document.getElementById("duongFilter");
    const resultPanel = document.getElementById("giaDatResultPanel");

    let giaDatRecords = [];

    // Tải và phân tích dữ liệu từ Google Sheet (Hỗ trợ cấu trúc phân tách bằng dấu chấm phẩy ';' như bạn yêu cầu)
    async function loadGiaDatFromSheet() {
        try {
            // Thay đường dẫn CSV của sheet "Giá đất" công khai của bạn vào đây
            const csvUrl = "https://script.google.com/macros/s/AKfycbz87dcUkndM5w5BeFqUFYJt8JDEcPu98IH5mbzNdov_6eXTNUEhIiknFQ9P7H2c0ZQE/exec"; 
            const response = await fetch(csvUrl);
            const dataText = await response.text();
            
            const lines = dataText.split("\n");
            giaDatRecords = [];

            // Duyệt qua từng dòng dữ liệu (Bỏ qua dòng tiêu đề đầu tiên)
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(";"); // Phân tách cột chuẩn dấu chấm phẩy ';'
                if (cols.length >= 4) {
                    giaDatRecords.push({
                        phuong: cols[0].trim(), // Cột Phường / Xã
                        duong: cols[1].trim(),  // Cột Tuyến đường
                        doan: cols[2].trim(),   // Cột Đoạn đường / Chi tiết
                        gia: cols[3].trim()     // Cột Mức giá đất
                    });
                }
            }
        } catch (err) {
            console.warn("Chưa kết nối được sheet trực tiếp, đang sử dụng dữ liệu mẫu dự phòng:", err);
            // Dữ liệu mẫu dự phòng kiểm tra giao diện
            giaDatRecords = [
                { phuong: "Phường 7", duong: "Hải Thượng Lãn Ông", doan: "Đoạn từ QL1 đến hết tuyến", gia: "3.500.000 đ/m²" },
                { phuong: "Phường 5", duong: "Phan Ngọc Hiển", doan: "Đoạn từ cầu Phụng Hiệp", gia: "12.000.000 đ/m²" },
                { phuong: "Xã Hòa Thành", duong: "Tuyến lộ Xà No", doan: "Toàn tuyến", gia: "1.200.000 đ/m²" }
            ];
        }
    }

    // Khởi chạy nạp dữ liệu
    loadGiaDatFromSheet();

    // Sự kiện 1: Khi chọn Phường/Xã -> Mở khóa và lọc danh sách Tuyến đường tương ứng
    if (phuongSelect && duongSelect) {
        phuongSelect.addEventListener("change", function () {
            const selectedPhuong = this.value;

            duongSelect.innerHTML = '<option value="">-- Tuyến đường --</option>';
            duongSelect.disabled = true;
            if (resultPanel) resultPanel.style.display = "none";

            if (!selectedPhuong) return;

            // Lọc các tuyến đường thuộc đúng Phường/Xã đã chọn từ sheet
            const matchedRows = giaDatRecords.filter(item => 
                item.phuong.toLowerCase() === selectedPhuong.toLowerCase()
            );

            if (matchedRows.length > 0) {
                duongSelect.disabled = false;
                // Lọc bỏ các tên đường bị trùng lặp
                const uniqueRoads = [...new Set(matchedRows.map(item => item.duong))];
                uniqueRoads.forEach(roadName => {
                    const opt = document.createElement("option");
                    opt.value = roadName;
                    opt.textContent = roadName;
                    duongSelect.appendChild(opt);
                });
            }
        });

        // Sự kiện 2: Khi chọn Tuyến đường -> Hiển thị kết quả giá đất trực tiếp lên bản đồ
        duongSelect.addEventListener("change", function () {
            const selectedPhuong = phuongSelect.value;
            const selectedDuong = this.value;

            if (!selectedDuong || !resultPanel) {
                resultPanel.style.display = "none";
                return;
            }

            // Tìm chính xác dòng bản ghi trong sheet Giá đất
            const itemFound = giaDatRecords.find(item => 
                item.phuong.toLowerCase() === selectedPhuong.toLowerCase() && 
                item.duong.toLowerCase() === selectedDuong.toLowerCase()
            );

            if (itemFound) {
                resultPanel.style.display = "block";
                resultPanel.innerHTML = `
                    <div style="font-weight: bold; color: #1a73e8; margin-bottom: 2px;">📍 ${itemFound.duong} (${itemFound.phuong})</div>
                    <div style="color: #555; margin-bottom: 2px;"><b>Đoạn:</b> ${itemFound.doan}</div>
                    <div style="color: #d9534f; font-weight: bold;"><b>Giá đất:</b> ${itemFound.gia}</div>
                `;
            } else {
                resultPanel.style.display = "none";
            }
        });
    }
});
