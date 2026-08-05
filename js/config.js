// js/config.js
const CONFIG = {
    // THÊM TỈNH TẠI ĐÂY
    PROVINCES: [
        { id: "VN", name: "Việt Nam", file: "" },                                     /* Lựa chọn hiển thị toàn bộ ranh giới tất cả các tỉnh thành cả nước */
        { id: "AnGiang", name: "Tỉnh An Giang", file: "./geojson/An-Giang.json" },       /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của Tỉnh An Giang */
        { id: "BacNinh", name: "Tỉnh Bắc Ninh", file: "./geojson/Bac-Ninh.json" },       /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của Tỉnh Bắc Ninh */
        { id: "CaMau", name: "Tỉnh Cà Mau", file: "./geojson/Ca-Mau.json" },             /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của Tỉnh Cà Mau */
        { id: "CaoBang", name: "Tỉnh Cao Bằng", file: "./geojson/Cao-Bang.json" },       /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của Tỉnh Cao Bằng */
        { id: "DakLak", name: "Tỉnh Dak Lak", file: "./geojson/Dak-Lak.json" },         /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của Tỉnh Dak Lak */
        { id: "DienBien", name: "Tỉnh Điện Biên", file: "./geojson/Dien-Bien.json" },   /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của Tỉnh Điện Biên */
        { id: "DongNai", name: "Tỉnh Đồng Nai", file: "./geojson/Dong-Nai.json" },       /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của Tỉnh Đồng Nai */
        { id: "DongThap", name: "Tỉnh Đồng Tháp", file: "./geojson/Dong-Thap.json" },   /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của Tỉnh Đồng Tháp */
        { id: "GiaLai", name: "Tỉnh Gia Lai", file: "./geojson/Gia-Lai.json" },         /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của Tỉnh Gia Lai */
        { id: "HaTinh", name: "Tỉnh Hà Tĩnh", file: "./geojson/Ha-Tinh.json" },         /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của Tỉnh Hà Tĩnh */
        { id: "HungYen", name: "Tỉnh Hưng Yên", file: "./geojson/Ha-Tinh.json" },       /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của Tỉnh Hưng Yên */
        { id: "KhanhHoa", name: "Tỉnh Khánh Hòa", file: "./geojson/Khanh-Hoa.json" },   /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của Tỉnh Khánh Hòa */
        { id: "LaiChau", name: "Tỉnh Lai Châu", file: "./geojson/Lai-Chau.json" },       /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của Tỉnh Lai Châu */
        { id: "LamDong", name: "Tỉnh Lâm Đồng", file: "./geojson/Lam-Dong.json" },       /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của Tỉnh Lâm Đồng */
        { id: "LangSon", name: "Tỉnh Lạng Sơn", file: "./geojson/Lang-Son.json" },       /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của Tỉnh Lạng Sơn */
        { id: "LaoCai", name: "Tỉnh Lào Cai", file: "./geojson/Lao-Cai.json" },         /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của Tỉnh Lào Cai */
        { id: "NgheAn", name: "Tỉnh Nghệ An", file: "./geojson/Nghe-An.json" },         /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của Tỉnh Nghệ An */
        { id: "NinhBinh", name: "Tỉnh Ninh Bình", file: "./geojson/Ninh_Binh.json" },   /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của Tỉnh Ninh Bình */
        { id: "PhuTho", name: "Tỉnh Phú Thọ", file: "./geojson/Phu-Tho.json" },         /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của Tỉnh Phú Thọ */
        { id: "QuangNgai", name: "Tỉnh Quảng Ngãi", file: "./geojson/Quang-Ngai.json" }, /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của Tỉnh Quảng Ngãi */
        { id: "QuangNinh", name: "Tỉnh Quảng Ninh", file: "./geojson/Quang-Ninh.json" }, /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của Tỉnh Quảng Ninh */
        { id: "QuangTri", name: "Tỉnh Quảng Trị", file: "./geojson/Quang-Tri.json" },   /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của Tỉnh Quảng Trị */
        { id: "SonLa", name: "Tỉnh Sơn La", file: "./geojson/Son-La.json" },             /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của Tỉnh Sơn La */
        { id: "TPCanTho", name: "Thành Phố Cần Thơ", file: "./geojson/TP-Can-Tho.json" }, /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của TP. Cần Thơ */
        { id: "TPDaNang", name: "Thành Phố Đà Nẵng", file: "./geojson/TP-Da-Nang.json" }, /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của TP. Đà Nẵng */
        { id: "TPHaNoi", name: "Thành Phố Hà Nội", file: "./geojson/TP-Ha-Noi.json" },     /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của TP. Hà Nội */
        { id: "TPHaiPhong", name: "Thành Phố Hải Phòng", file: "./geojson/TP-Hai-Phong.json" }, /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của TP. Hải Phòng */
        { id: "TPHoChiMinh", name: "Thành Phố Hồ Chí Minh", file: "./geojson/TP-Ho-Chi-Minh.json" }, /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của TP. Hồ Chí Minh */
        { id: "TPHue", name: "Thành Phố Huế", file: "./geojson/TP-Hue.json" },           /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của Thành Phố Huế */
        { id: "TayNinh", name: "Tỉnh Tây Ninh", file: "./geojson/Tay-Ninh.json" },       /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của Tỉnh Tây Ninh */
        { id: "ThaiNguyen", name: "Tỉnh Thái Nguyên", file: "./geojson/Thai-Nguyên.json" }, /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của Tỉnh Thái Nguyên */
        { id: "ThanhHoa", name: "Tỉnh Thanh Hóa", file: "./geojson/Thanh-Hoa.json" },   /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của Tỉnh Thanh Hóa */
        { id: "TuyenQuang", name: "Tỉnh Tuyên Quang", file: "./geojson/Tuyen-Quang.json" }, /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của Tỉnh Tuyên Quang */
        { id: "VinhLong", name: "Tỉnh Vĩnh Long", file: "./geojson/Vĩnh-Long.json" }     /* Cấu hình ranh giới và tệp dữ liệu GeoJSON của Tỉnh Vĩnh Long */
    ],

    // Cập nhật đường dẫn Web URL của Sheet tại đây
    SHEET_DATA_URL: 'https://script.google.com/macros/s/AKfycbz87dcUkndM5w5BeFqUFYJt8JDEcPu98IH5mbzNdov_6eXTNUEhIiknFQ9P7H2c0ZQE/exec', /* Đường dẫn kết nối API Google Apps Script để tải dữ liệu thửa đất */

    // Cấu hình giao diện nền bản đồ vệ tinh sử dụng nguồn tile trực tiếp từ Google Maps
    MAP_STYLE: {
        'version': 8,                                 /* Phiên bản định dạng cấu hình style của MapLibre GL */
        'sources': {
            'google-satellite': {
                'type': 'raster',                     /* Định dạng nguồn ảnh dạng lưới raster */
                'tiles': ['https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'], /* URL lấy mảnh ảnh bản đồ vệ tinh Google */
                'tileSize': 256                       /* Kích thước tiêu chuẩn của mỗi mảnh ảnh (tile) là 256x256 pixel */
            }
        },
        'layers': [
            {
                'id': 'google-satellite-layer',       /* ID định danh lớp hiển thị bản đồ vệ tinh */
                'type': 'raster',                     /* Kiểu hiển thị là dạng ảnh raster */
                'source': 'google-satellite',         /* Liên kết trực tiếp đến nguồn 'google-satellite' đã định nghĩa phía trên */
                'minzoom': 0,                         /* Mức thu nhỏ tối đa cho phép hiển thị */
                'maxzoom': 22                         /* Mức phóng to chi tiết tối đa cho phép hiển thị */
            }
        ]
    },

    MAP_CENTER: [105.15, 9.18],                       /* Tọa độ trung tâm mặc định khởi tạo ban đầu cho toàn bản đồ [Kinh độ, Vĩ độ] */
    MAP_ZOOM: 12,                                      /* Mức độ phóng to (zoom level) mặc định khi vừa mở trang web */
    FILL_COLOR: '#00ffcc',                             /* Màu tô nền mặc định cho các thửa đất/vùng chọn */
    FILL_OPACITY: 0.3,                                 /* Độ trong suốt của lớp màu tô nền (0.3 tương đương 30%) */
    OUTLINE_COLOR: '#ffffff'                           /* Màu đường viền bao quanh thửa đất (màu trắng) */
};

// Biểu thức quy tắc phân loại màu sắc quy hoạch dựa theo từng loại đất cụ thể
const COLOR_MATCH_EXPRESSION = [
    'match',                                           /* Hàm so khớp điều kiện của MapLibre Style Specification */
    ['get', 'Loại Đất'],                               /* Lấy giá trị thuộc tính 'Loại Đất' của từng thửa đất từ dữ liệu bản đồ */
    'Đất ở tại đô thị', '#e063ce',                     /* Nếu là Đất ở tại đô thị -> Tô màu hồng đậm (#e063ce) */
    'Đất ở tại nông thôn', '#cf99c7',                  /* Nếu là Đất ở tại nông thôn -> Tô màu tím nhạt (#cf99c7) */
    'Đất nuôi trồng thuỷ sản', '#00b4d8',              /* Nếu là Đất nuôi trồng thuỷ sản -> Tô màu xanh dương nhạt (#00b4d8) */
    'Đất nuôi trồng thủy sản', '#00b4d8',              /* Dự phòng thêm trường hợp sai chính tả dấu/chữ -> Tô màu xanh dương nhạt */
    'Đất trồng cây lâu năm', '#519e05',                /* Nếu là Đất trồng cây lâu năm -> Tô màu xanh lá mạ (#519e05) */
    'Đất trồng cây hàng năm khác', '#519e05',          /* Nếu là Đất trồng cây hàng năm khác -> Tô màu xanh lá mạ (#519e05) */
    'Đất trồng lúa', '#f5e753',                        /* Nếu là Đất trồng lúa -> Tô màu vàng nhạt (#f5e753) */
    'Đất chuyên trồng lúa nước', '#ffea00',            /* Nếu là Đất chuyên trồng lúa nước -> Tô màu vàng tươi (#ffea00) */
    '#c2b9ab'                                          /* Màu mặc định dự phòng nếu loại đất không nằm trong danh sách trên (màu xám cát) */
];
