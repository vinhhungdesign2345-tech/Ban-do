/**
 * Mô-đun: Tra cứu giá đất theo tên đường (Hiển thị trọn vẹn 4 cột C, D, E, F cho từng đoạn của tuyến đường)
 */
document.addEventListener("DOMContentLoaded", function () {
    const phuongSelect = document.getElementById("phuongFilter");
    const duongInput = document.getElementById("duongFilter");
    const searchDuongBtn = document.getElementById("searchDuongBtn");
    const popupList = document.getElementById("duongPopupList");
    const resultPanel = document.getElementById("giaDatResultPanel");

    let giaDatRecords = [];

    function removeDiacritics(str) {
        return (str || "")
            .toString()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
            .replace(/\s+/g, " ")
            .trim();
    }

    function updateInputState() {
        const hasPhuong = phuongSelect && phuongSelect.value && phuongSelect.value.trim() !== "";
        if (duongInput) duongInput.disabled = !hasPhuong;
        if (searchDuongBtn) searchDuongBtn.disabled = !hasPhuong;
        
        if (!hasPhuong && duongInput) {
            duongInput.value = "";
            if (resultPanel) resultPanel.style.display = "none";
            if (popupList) popupList.style.display = "none";
        }
    }

    // Tải dữ liệu và ánh xạ chuẩn xác tuyệt đối các cột: Phường(A), Đường(C), Từ(D), Đến(E), Giá(F)
    async function loadGiaDatFromSheet() {
        try {
            const apiUrl = "https://script.google.com/macros/s/AKfycbz87dcUkndM5w5BeFqUFYJt8JDEcPu98IH5mbzNdov_6eXTNUEhIiknFQ9P7H2c0ZQE/exec?sheet=giadat";
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (Array.isArray(data)) {
                giaDatRecords = data.map(item => {
                    let phuong = "", duong = "", tu = "", den = "", gia = "";

                    if (Array.isArray(item)) {
                        phuong = item[0] || ""; // Cột A
                        duong = item[2] || "";  // Cột C
                        tu = item[3] || "";     // Cột D
                        den = item[4] || "";    // Cột E
                        gia = item[5] || "";    // Cột F
                    } else if (typeof item === "object" && item !== null) {
                        phuong = item.phuong || item.Phuong || item[0] || "";
                        duong = item.duong || item.Duong || item[2] || "";
                        tu = item.tu || item.Tu || item[3] || "";
                        den = item.den || item.Den || item[4] || "";
                        gia = item.gia || item.Gia || item[5] || "";
                    }

                    return {
                        phuong: phuong.toString().trim(),
                        duong: duong.toString().trim(),
                        tu: tu.toString().trim(),
                        den: den.toString().trim(),
                        gia: gia.toString().trim()
                    };
                });
            } else {
                throw new Error("Dữ liệu không phải mảng JSON hợp lệ");
            }
        } catch (err) {
            console.warn("Dùng dữ liệu mẫu dự phòng do lỗi API:", err);
            giaDatRecords = [
                { phuong: "PHƯỜNG HOÀ THÀNH", duong: "Hải Thượng Lãn Ông", tu: "Huỳnh Thúc Kháng", den: "Kênh Cổng Đôi", gia: "12.600" }
            ];
        }
        updateInputState();
    }

    loadGiaDatFromSheet();

    function thucHienTimKiemDuong() {
        const keywordClean = removeDiacritics(duongInput.value);
        const selectedPhuongClean = removeDiacritics(phuongSelect.value);

        if (!resultPanel) return;
        resultPanel.style.display = "block";

        if (!selectedPhuongClean) {
            resultPanel.innerHTML = `<div style="color: #d9534f; padding: 5px;">Vui lòng chọn Phường/Xã trước khi tra cứu giá đất!</div>`;
            return;
        }

        if (!keywordClean) {
            resultPanel.innerHTML = `<div style="color: #d9534f; padding: 5px;">Vui lòng nhập tên đường cần tra cứu.</div>`;
            return;
        }

        // Lọc chính xác: Phường khớp VÀ Tên đường (cột C) chứa từ khóa tìm kiếm
        const matchedRows = giaDatRecords.filter(item => {
            const itemPhuongClean = removeDiacritics(item.phuong);
            const itemDuongClean = removeDiacritics(item.duong);

            const matchPhuong = itemPhuongClean.includes(selectedPhuongClean) || selectedPhuongClean.includes(itemPhuongClean);
            const matchDuong = itemDuongClean.includes(keywordClean);

            return matchPhuong && matchDuong;
        });

        if (popupList) popupList.style.display = "none";

        if (matchedRows.length > 0) {
            let htmlContent = `<div style="font-weight: bold; color: #1a73e8; margin-bottom: 8px; font-size: 13px;">📍 Kết quả: ${duongInput.value} (${matchedRows.length} đoạn)</div>`;
            
            // Duyệt qua từng đoạn của tuyến đường, mỗi đoạn bắt buộc hiển thị đủ 4 dòng tương ứng 4 cột C, D, E, F
            matchedRows.forEach((row, index) => {
                htmlContent += `
                    <div style="background: #fff; border: 1px solid #ddd; border-radius: 4px; padding: 8px; margin-bottom: 8px; font-size: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); line-height: 1.5;">
                        <div style="font-weight: bold; color: #333; margin-bottom: 4px; border-bottom: 1px solid #eee; padding-bottom: 2px;">Đoạn số ${index + 1}</div>
                        <div style="color: #000; margin-bottom: 2px;"><b>Đường:</b> ${row.duong || '---'}</div>
                        <div style="color: #333; margin-bottom: 2px;"><b>Từ:</b> ${row.tu || '---'}</div>
                        <div style="color: #333; margin-bottom: 2px;"><b>Đến:</b> ${row.den || '---'}</div>
                        <div style="color: #d9534f; font-weight: bold; border-top: 1px dashed #eee; padding-top: 4px;"><b>Giá:</b> ${row.gia || '---'}</div>
                    </div>
                `;
            });

            resultPanel.innerHTML = htmlContent;
        } else {
            resultPanel.innerHTML = `<div style="color: #d9534f; padding: 5px;">Không tìm thấy đường "${duongInput.value}" trong khu vực này.</div>`;
        }
    }

    if (phuongSelect && duongInput && searchDuongBtn) {
        phuongSelect.addEventListener("change", updateInputState);

        const observer = new MutationObserver(updateInputState);
        observer.observe(phuongSelect, { attributes: true, childList: true, subtree: true });
        setInterval(updateInputState, 500);

        duongInput.addEventListener("input", function () {
            updateInputState();
            const keywordClean = removeDiacritics(this.value);
            const selectedPhuongClean = removeDiacritics(phuongSelect.value);

            if (!keywordClean || !selectedPhuongClean || !popupList) {
                if (popupList) popupList.style.display = "none";
                return;
            }

            // Gợi ý popup chỉ lấy theo tên đường (cột C)
            const matchedRows = giaDatRecords.filter(item => {
                const itemPhuongClean = removeDiacritics(item.phuong);
                const itemDuongClean = removeDiacritics(item.duong);
                const matchPhuong = itemPhuongClean.includes(selectedPhuongClean) || selectedPhuongClean.includes(itemPhuongClean);
                return matchPhuong && itemDuongClean.includes(keywordClean);
            });

            // Lọc danh sách đường duy nhất để hiển thị gợi ý gọn gàng
            const uniqueRoads = [...new Set(matchedRows.map(r => r.duong))];

            if (uniqueRoads.length > 0) {
                popupList.innerHTML = "";
                popupList.style.display = "block";

                uniqueRoads.forEach(roadName => {
                    const divItem = document.createElement("div");
                    divItem.style.padding = "8px 10px";
                    divItem.style.cursor = "pointer";
                    divItem.style.borderBottom = "1px solid #eee";
                    divItem.innerHTML = `<b>${roadName}</b>`;

                    divItem.addEventListener("mouseenter", () => divItem.style.backgroundColor = "#f1f3f4");
                    divItem.addEventListener("mouseleave", () => divItem.style.backgroundColor = "#fff");

                    divItem.addEventListener("click", function () {
                        duongInput.value = roadName;
                        popupList.style.display = "none";
                        thucHienTimKiemDuong();
                    });

                    popupList.appendChild(divItem);
                });
            } else {
                popupList.style.display = "none";
            }
        });

        searchDuongBtn.addEventListener("click", function (e) {
            e.preventDefault();
            thucHienTimKiemDuong();
        });

        duongInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                thucHienTimKiemDuong();
            }
        });

        document.addEventListener("click", function (e) {
            if (popupList && !duongInput.contains(e.target) && !popupList.contains(e.target) && !searchDuongBtn.contains(e.target)) {
                popupList.style.display = "none";
            }
        });
    }
});
