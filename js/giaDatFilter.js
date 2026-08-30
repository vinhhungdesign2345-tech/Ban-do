/**
 * Mô-đun: Tra cứu giá đất theo tên đường (Dạng nhập liệu Ctrl+F kết hợp Popup kết quả)
 * Sử dụng chung URL Google Apps Script: AKfycbz87dcUkndM5w5BeFqUFYJt8JDEcPu98IH5mbzNdov_6eXTNUEhIiknFQ9P7H2c0ZQE/exec
 */
document.addEventListener("DOMContentLoaded", function () {
    const phuongSelect = document.getElementById("phuongFilter");
    const duongInput = document.getElementById("duongFilter");
    const popupList = document.getElementById("duongPopupList");
    const resultPanel = document.getElementById("giaDatResultPanel");

    let giaDatRecords = [];

    // Tải dữ liệu từ URL Google Apps Script chung
    async function loadGiaDatFromSheet() {
        try {
            // Sử dụng chung URL Apps Script của bạn (có thể thêm tham số ?sheet=giadat nếu backend phân chia tab)
            const apiUrl = "https://script.google.com/macros/s/AKfycbz87dcUkndM5w5BeFqUFYJt8JDEcPu98IH5mbzNdov_6eXTNUEhIiknFQ9P7H2c0ZQE/exec?sheet=giadat";
            
            const response = await fetch(apiUrl);
            const data = await response.json(); // Hoặc .text() tùy thuộc vào định dạng trả về của API (JSON hay Text/CSV)

            // Kiểm tra nếu dữ liệu trả về là mảng JSON chuẩn từ Apps Script
            if (Array.isArray(data)) {
                giaDatRecords = data.map(item => ({
                    phuong: (item.phuong || item.Phuong || "").toString().trim(),
                    duong: (item.duong || item.Duong || "").toString().trim(),
                    doan: (item.doan || item.Doan || "").toString().trim(),
                    gia: (item.gia || item.Gia || "").toString().trim()
                }));
            } else {
                throw new Error("Dữ liệu không phải là mảng JSON hợp lệ");
            }
        } catch (err) {
            console.warn("Không tải được dữ liệu trực tiếp từ API chung, đang sử dụng dữ liệu mẫu dự phòng:", err);
            // Dữ liệu mẫu dự phòng kiểm tra giao diện
            giaDatRecords = [
                { phuong: "Phường 7", duong: "Hải Thượng Lãn Ông", doan: "Đoạn từ QL1 đến hết tuyến", gia: "3.500.000 đ/m²" },
                { phuong: "Phường 7", duong: "Hùng Vương", doan: "Toàn tuyến", gia: "5.000.000 đ/m²" },
                { phuong: "Phường 5", duong: "Phan Ngọc Hiển", doan: "Đoạn từ cầu Phụng Hiệp", gia: "12.000.000 đ/m²" },
                { phuong: "Xã Hòa Thành", duong: "Tuyến lộ Xà No", doan: "Toàn tuyến", gia: "1.200.000 đ/m²" }
            ];
        }
    }

    loadGiaDatFromSheet();

    // 1. Khi chọn Phường/Xã -> Mở khóa ô nhập tên đường
    if (phuongSelect && duongInput) {
        phuongSelect.addEventListener("change", function () {
            const selectedPhuong = this.value;
            duongInput.value = "";
            duongInput.disabled = !selectedPhuong; // Mở khóa khi đã chọn Phường
            if (popupList) popupList.style.display = "none";
            if (resultPanel) resultPanel.style.display = "none";
        });

        // 2. Khi người dùng gõ vào ô tên đường (Hoạt động như Ctrl + F)
        duongInput.addEventListener("input", function () {
            const keyword = this.value.toLowerCase().trim();
            const selectedPhuong = phuongSelect.value;

            if (!keyword || !selectedPhuong) {
                popupList.style.display = "none";
                return;
            }

            // Lọc các tuyến đường thuộc đúng Phường đã chọn và khớp từ khóa gõ vào
            const matchedRows = giaDatRecords.filter(item => 
                item.phuong.toLowerCase() === selectedPhuong.toLowerCase() &&
                item.duong.toLowerCase().includes(keyword)
            );

            // Hiển thị popup kết quả
            if (matchedRows.length > 0) {
                popupList.innerHTML = "";
                popupList.style.display = "block";

                matchedRows.forEach(row => {
                    const divItem = document.createElement("div");
                    divItem.style.padding = "8px 10px";
                    divItem.style.cursor = "pointer";
                    divItem.style.borderBottom = "1px solid #eee";
                    divItem.innerHTML = `<b>${row.duong}</b> <span style="font-size: 11px; color: #666;">(${row.doan})</span>`;

                    // Hiệu ứng hover chuột
                    divItem.addEventListener("mouseenter", () => divItem.style.backgroundColor = "#f1f3f4");
                    divItem.addEventListener("mouseleave", () => divItem.style.backgroundColor = "#fff");

                    // Khi người dùng bấm chọn một đường từ popup danh sách
                    divItem.addEventListener("click", function () {
                        duongInput.value = row.duong; // Điền tên đường vào ô input
                        popupList.style.display = "none"; // Ẩn popup đi

                        // Hiển thị kết quả giá đất chi tiết vào panel
                        resultPanel.style.display = "block";
                        resultPanel.innerHTML = `
                            <div style="font-weight: bold; color: #1a73e8; margin-bottom: 2px;">📍 ${row.duong} (${row.phuong})</div>
                            <div style="color: #555; margin-bottom: 2px;"><b>Đoạn:</b> ${row.doan}</div>
                            <div style="color: #d9534f; font-weight: bold;"><b>Giá đất:</b> ${row.gia}</div>
                        `;
                    });

                    popupList.appendChild(divItem);
                });
            } else {
                popupList.style.display = "none";
            }
        });

        // Ẩn popup khi click ra vùng ngoài màn hình
        document.addEventListener("click", function (e) {
            if (!duongInput.contains(e.target) && !popupList.contains(e.target)) {
                popupList.style.display = "none";
            }
        });
    }
});
