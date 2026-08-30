/**
 * Mô-đun: Tra cứu giá đất theo tên đường (Liệt kê đủ 4 cột: Đường, Từ, Đến, Giá đất)
 */
document.addEventListener("DOMContentLoaded", function () {
    const phuongSelect = document.getElementById("phuongFilter");
    const duongInput = document.getElementById("duongFilter");
    const searchDuongBtn = document.getElementById("searchDuongBtn");
    const popupList = document.getElementById("duongPopupList");
    const resultPanel = document.getElementById("giaDatResultPanel");

    let giaDatRecords = [];

    // Hàm loại bỏ dấu tiếng Việt để so khớp chính xác tuyệt đối
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

    // Tải dữ liệu và map chính xác tuyệt đối từng cột dựa trên tiêu đề cột và giá trị thực tế
    async function loadGiaDatFromSheet() {
        try {
            const apiUrl = "https://script.google.com/macros/s/AKfycbz87dcUkndM5w5BeFqUFYJt8JDEcPu98IH5mbzNdov_6eXTNUEhIiknFQ9P7H2c0ZQE/exec?sheet=giadat";
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (Array.isArray(data)) {
                giaDatRecords = data.map(item => {
                    let phuong = "", duong = "", tu = "", den = "", gia = "";
                    
                    if (Array.isArray(item)) {
                        // Trường hợp API trả về dạng mảng thuần túy từ cột A đến E
                        phuong = (item[0] || "").toString().trim();
                        duong = (item[1] || "").toString().trim();
                        tu = (item[2] || "").toString().trim();
                        den = (item[3] || "").toString().trim();
                        gia = (item[4] || "").toString().trim();
                    } else if (typeof item === "object" && item !== null) {
                        // Trường hợp API trả về dạng Object theo tên tiêu đề cột trong Sheet
                        phuong = (item["Phường"] || item["Phuong"] || Object.values(item)[0] || "").toString().trim();
                        duong = (item["Đường"] || item["Duong"] || item["Tên đường"] || Object.values(item)[1] || "").toString().trim();
                        tu = (item["Từ"] || item["Tu"] || Object.values(item)[2] || "").toString().trim();
                        den = (item["Đến"] || item["Den"] || Object.values(item)[3] || "").toString().trim();
                        
                        // Lấy chuẩn xác cột có tiêu đề là "Giá đất năm 2026" từ Google Sheet
                        gia = (item["Giá đất năm 2026"] || item["Giá đất"] || item["Gia dat nam 2026"] || item["Gia dat"] || "").toString().trim();
                        
                        // Fallback dự phòng thông minh nếu Object không map sẵn tên khóa
                        if (!gia) {
                            const vals = Object.values(item).map(v => (v || "").toString().trim());
                            let val3 = vals[3] || "";
                            let val4 = vals[4] || "";

                            if (val4 && (/^\d+([.,]\d+)*$/.test(val4) || val4.length <= 8)) {
                                den = val3;
                                gia = val4;
                            } else if (val3 && (/^\d+([.,]\d+)*$/.test(val3) || val3.length <= 8) && !val4) {
                                den = vals.length > 5 ? vals[3] : "";
                                gia = val3;
                            } else {
                                den = val3;
                                gia = val4;
                            }
                        }
                    }

                    return { phuong, duong, tu, den, gia };
                });
            } else {
                throw new Error("Dữ liệu không phải mảng JSON hợp lệ");
            }
        } catch (err) {
            console.warn("Dùng dữ liệu mẫu dự phòng do lỗi API:", err);
            giaDatRecords = [
                { phuong: "PHƯỜNG HOÀ THÀNH", duong: "Hải Thượng Lãn Ông", tu: "Huỳnh Thúc Kháng", den: "Kênh Cổng Đôi", gia: "12.600" },
                { phuong: "PHƯỜNG HOÀ THÀNH", duong: "Hải Thượng Lãn Ông", tu: "Kênh Cổng Đôi", den: "Cổng Cầu Nhum", gia: "9.600" },
                { phuong: "PHƯỜNG HOÀ THÀNH", duong: "Đường Cà Mau - Đầm Dơi", tu: "Đường Hải Thượng Lãn Ông", den: "hết đoạn 2 chiều", gia: "9.600" }
            ];
        }
        updateInputState();
    }

    loadGiaDatFromSheet();

    // Thực hiện tìm kiếm và hiển thị dạng 4 cột chi tiết
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

        // Lọc thông minh: Phường khớp VÀ từ khóa xuất hiện ở BẤT KỲ cột nào (Tên đường, Từ, hoặc Đến)
        const matchedRows = giaDatRecords.filter(item => {
            const itemPhuongClean = removeDiacritics(item.phuong);
            const itemDuongClean = removeDiacritics(item.duong);
            const itemTuClean = removeDiacritics(item.tu);
            const itemDenClean = removeDiacritics(item.den);

            const matchPhuong = itemPhuongClean.includes(selectedPhuongClean) || selectedPhuongClean.includes(itemPhuongClean);
            const matchKeyword = itemDuongClean.includes(keywordClean) || itemTuClean.includes(keywordClean) || itemDenClean.includes(keywordClean);

            return matchPhuong && matchKeyword;
        });

        if (popupList) popupList.style.display = "none";

        if (matchedRows.length > 0) {
            let htmlContent = `<div style="font-weight: bold; color: #1a73e8; margin-bottom: 8px; font-size: 13px;">📍 Kết quả tại: ${phuongSelect.value} (${matchedRows.length} dòng)</div>`;
            
            matchedRows.forEach(row => {
                htmlContent += `
                    <div style="background: #fff; border: 1px solid #ddd; border-radius: 4px; padding: 8px; margin-bottom: 6px; font-size: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                        <div style="color: #000; font-weight: bold; margin-bottom: 3px;">🛣️ Đường: ${row.duong || '(Trống)'}</div>
                        <div style="color: #444; margin-bottom: 2px;"><b>Từ:</b> ${row.tu || '---'}</div>
                        <div style="color: #444; margin-bottom: 4px;"><b>Đến:</b> ${row.den || '---'}</div>
                        <div style="color: #d9534f; font-weight: bold; border-top: 1px dashed #eee; padding-top: 4px;">💰 Giá đất: ${row.gia ? row.gia + ' đ/m²' : 'Chưa cập nhật'}</div>
                    </div>
                `;
            });

            resultPanel.innerHTML = htmlContent;
        } else {
            resultPanel.innerHTML = `<div style="color: #d9534f; padding: 5px;">Không tìm thấy nội dung liên quan đến "${duongInput.value}" trong khu vực này.</div>`;
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

            const matchedRows = giaDatRecords.filter(item => {
                const itemPhuongClean = removeDiacritics(item.phuong);
                const itemDuongClean = removeDiacritics(item.duong);
                const itemTuClean = removeDiacritics(item.tu);
                const itemDenClean = removeDiacritics(item.den);
                const matchPhuong = itemPhuongClean.includes(selectedPhuongClean) || selectedPhuongClean.includes(itemPhuongClean);
                return matchPhuong && (itemDuongClean.includes(keywordClean) || itemTuClean.includes(keywordClean) || itemDenClean.includes(keywordClean));
            });

            if (matchedRows.length > 0) {
                popupList.innerHTML = "";
                popupList.style.display = "block";

                matchedRows.forEach(row => {
                    const divItem = document.createElement("div");
                    divItem.style.padding = "8px 10px";
                    divItem.style.cursor = "pointer";
                    divItem.style.borderBottom = "1px solid #eee";
                    divItem.innerHTML = `<b>${row.duong}</b> <span style="font-size: 11px; color: #666;">(Từ: ${row.tu} - Đến: ${row.den})</span>`;

                    divItem.addEventListener("mouseenter", () => divItem.style.backgroundColor = "#f1f3f4");
                    divItem.addEventListener("mouseleave", () => divItem.style.backgroundColor = "#fff");

                    divItem.addEventListener("click", function () {
                        duongInput.value = row.duong;
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
