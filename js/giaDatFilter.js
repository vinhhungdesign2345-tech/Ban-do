/**
 * Mô-đun: Tra cứu giá đất theo tên đường (Có kèm nút bấm tìm kiếm và gợi ý Popup)
 * Sử dụng chung URL Google Apps Script: AKfycbz87dcUkndM5w5BeFqUFYJt8JDEcPu98IH5mbzNdov_6eXTNUEhIiknFQ9P7H2c0ZQE/exec
 */
document.addEventListener("DOMContentLoaded", function () {
    const phuongSelect = document.getElementById("phuongFilter");
    const duongInput = document.getElementById("duongFilter");
    const searchDuongBtn = document.getElementById("searchDuongBtn"); // Nút tìm kiếm tên đường mới thêm
    const popupList = document.getElementById("duongPopupList");
    const resultPanel = document.getElementById("giaDatResultPanel");

    let giaDatRecords = [];

    // Tải dữ liệu từ URL Google Apps Script chung
    async function loadGiaDatFromSheet() {
        try {
            const apiUrl = "https://script.google.com/macros/s/AKfycbz87dcUkndM5w5BeFqUFYJt8JDEcPu98IH5mbzNdov_6eXTNUEhIiknFQ9P7H2c0ZQE/exec?sheet=giadat";
            
            const response = await fetch(apiUrl);
            const data = await response.json();

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
            giaDatRecords = [
                { phuong: "Phường 7", duong: "Hải Thượng Lãn Ông", doan: "Đoạn từ QL1 đến hết tuyến", gia: "3.500.000 đ/m²" },
                { phuong: "Phường 7", duong: "Hùng Vương", doan: "Toàn tuyến", gia: "5.000.000 đ/m²" },
                { phuong: "Phường 5", duong: "Phan Ngọc Hiển", doan: "Đoạn từ cầu Phụng Hiệp", gia: "12.000.000 đ/m²" },
                { phuong: "Xã Hòa Thành", duong: "Tuyến lộ Xà No", doan: "Toàn tuyến", gia: "1.200.000 đ/m²" }
            ];
        }
    }

    loadGiaDatFromSheet();

    // Hàm thực hiện logic tìm kiếm và hiển thị kết quả ra panel
    function thucHienTimKiemDuong() {
        const keyword = duongInput.value.toLowerCase().trim();
        const selectedPhuong = phuongSelect.value;

        if (!keyword || !selectedPhuong) return;

        const matchedRow = giaDatRecords.find(item => 
            item.phuong.toLowerCase() === selectedPhuong.toLowerCase() &&
            item.duong.toLowerCase().includes(keyword)
        );

        if (matchedRow) {
            duongInput.value = matchedRow.duong;
            popupList.style.display = "none";

            resultPanel.style.display = "block";
            resultPanel.innerHTML = `
                <div style="font-weight: bold; color: #1a73e8; margin-bottom: 2px;">📍 ${matchedRow.duong} (${matchedRow.phuong})</div>
                <div style="color: #555; margin-bottom: 2px;"><b>Đoạn:</b> ${matchedRow.doan}</div>
                <div style="color: #d9534f; font-weight: bold;"><b>Giá đất:</b> ${matchedRow.gia}</div>
            `;
        } else {
            popupList.style.display = "none";
            resultPanel.style.display = "block";
            resultPanel.innerHTML = `<div style="color: #d9534f;">Không tìm thấy tuyến đường phù hợp.</div>`;
        }
    }

    // 1. Khi chọn Phường/Xã -> Mở khóa ô nhập tên đường và nút tìm kiếm
    if (phuongSelect && duongInput && searchDuongBtn) {
        phuongSelect.addEventListener("change", function () {
            const selectedPhuong = this.value;
            duongInput.value = "";
            const isDisabled = !selectedPhuong;
            duongInput.disabled = isDisabled;
            searchDuongBtn.disabled = isDisabled; // Khóa/mở khóa nút tìm kiếm theo phường

            if (popupList) popupList.style.display = "none";
            if (resultPanel) resultPanel.style.display = "none";
        });

        // 2. Khi người dùng gõ vào ô tên đường (Hiển thị popup gợi ý)
        duongInput.addEventListener("input", function () {
            const keyword = this.value.toLowerCase().trim();
            const selectedPhuong = phuongSelect.value;

            if (!keyword || !selectedPhuong) {
                popupList.style.display = "none";
                return;
            }

            const matchedRows = giaDatRecords.filter(item => 
                item.phuong.toLowerCase() === selectedPhuong.toLowerCase() &&
                item.duong.toLowerCase().includes(keyword)
            );

            if (matchedRows.length > 0) {
                popupList.innerHTML = "";
                popupList.style.display = "block";

                matchedRows.forEach(row => {
                    const divItem = document.createElement("div");
                    divItem.style.padding = "8px 10px";
                    divItem.style.cursor = "pointer";
                    divItem.style.borderBottom = "1px solid #eee";
                    divItem.innerHTML = `<b>${row.duong}</b> <span style="font-size: 11px; color: #666;">(${row.doan})</span>`;

                    divItem.addEventListener("mouseenter", () => divItem.style.backgroundColor = "#f1f3f4");
                    divItem.addEventListener("mouseleave", () => divItem.style.backgroundColor = "#fff");

                    divItem.addEventListener("click", function () {
                        duongInput.value = row.duong;
                        popupList.style.display = "none";
                        thucHienTimKiemDuong(); // Gọi hàm hiển thị kết quả khi click chọn mục trong popup
                    });

                    popupList.appendChild(divItem);
                });
            } else {
                popupList.style.display = "none";
            }
        });

        // 3. Xử lý khi nhấn nút tìm kiếm 🔍
        searchDuongBtn.addEventListener("click", function (e) {
            e.preventDefault();
            thucHienTimKiemDuong();
        });

        // 4. Xử lý khi nhấn phím ENTER trong ô nhập tên đường
        duongInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                thucHienTimKiemDuong();
            }
        });

        // Ẩn popup khi click ra vùng ngoài màn hình
        document.addEventListener("click", function (e) {
            if (!duongInput.contains(e.target) && !popupList.contains(e.target) && !searchDuongBtn.contains(e.target)) {
                popupList.style.display = "none";
            }
        });
    }
});
