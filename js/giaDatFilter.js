/**
 * Mô-đun: Tra cứu giá đất theo Phường/Xã và Tuyến đường
 * Đồng bộ cấu trúc giao diện với hệ thống bộ lọc hành chính sẵn có.
 */
document.addEventListener("DOMContentLoaded", function () {
    const phuongSelect = document.getElementById("phuongFilter");
    const duongSelect = document.getElementById("duongFilter");
    const resultPanel = document.getElementById("giaDatResultPanel");

    // Cơ sở dữ liệu mẫu bảng giá đất (Bạn có thể thay thế hoặc liên kết trực tiếp từ sheet dữ liệu của mình)
    const giaDatDatabase = [
        { phuong: "Phường 7", duong: "Hải Thượng Lãn Ông", doan: "Đoạn từ Quốc lộ 1 đến hết tuyến", gia: "3.500.000 đ/m²" },
        { phuong: "Phường 5", duong: "Phan Ngọc Hiển", doan: "Đoạn từ cầu Phụng Hiệp đến Lý Thường Kiệt", gia: "12.000.000 đ/m²" },
        { phuong: "Xã Hòa Thành", duong: "Tuyến lộ Xà No", doan: "Toàn tuyến xã Hòa Thành", gia: "1.200.000 đ/m²" }
    ];

    // Sự kiện khi thay đổi Phường / Xã
    if (phuongSelect && duongSelect) {
        phuongSelect.addEventListener("change", function () {
            const selectedPhuong = this.value;

            // Reset dropdown tuyến đường và ẩn panel kết quả
            duongSelect.innerHTML = '<option value="">-- Tuyến đường --</option>';
            duongSelect.disabled = true;
            if (resultPanel) resultPanel.style.display = "none";

            if (!selectedPhuong) return;

            // Lọc danh sách tuyến đường tương ứng với phường được chọn
            const availableRoads = giaDatDatabase.filter(item => item.phuong === selectedPhuong);

            if (availableRoads.length > 0) {
                duongSelect.disabled = false;
                availableRoads.forEach(item => {
                    const option = document.createElement("option");
                    option.value = item.duong;
                    option.textContent = item.duong;
                    duongSelect.appendChild(option);
                });
            }
        });

        // Sự kiện khi chọn Tuyến đường cụ thể
        duongSelect.addEventListener("change", function () {
            const selectedPhuong = phuongSelect.value;
            const selectedDuong = this.value;

            if (!selectedDuong || !resultPanel) {
                resultPanel.style.display = "none";
                return;
            }

            // Tìm kiếm dữ liệu giá đất khớp chính xác Phường và Đường
            const record = giaDatDatabase.find(item => item.phuong === selectedPhuong && item.duong === selectedDuong);

            if (record) {
                resultPanel.style.display = "block";
                resultPanel.innerHTML = `
                    <div style="font-weight: bold; color: #1a73e8; margin-bottom: 2px;">📍 ${record.duong} (${record.phuong})</div>
                    <div style="color: #555; margin-bottom: 2px;"><b>Đoạn:</b> ${record.doan}</div>
                    <div style="color: #d9534f; font-weight: bold;"><b>Giá đất:</b> ${record.gia}</div>
                `;
            } else {
                resultPanel.style.display = "none";
            }
        });
    }
});
