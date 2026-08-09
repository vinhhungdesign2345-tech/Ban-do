// js/config.js
const CONFIG = {
    // Danh sách các tỉnh/thành phố có dữ liệu quy hoạch (được load vào dropdown menu)
    PROVINCES: [
        { id: "AnGiang", name: "Tỉnh An Giang", file: "./geojson/An-Giang.json" },
        { id: "BacNinh", name: "Tỉnh Bắc Ninh", file: "./geojson/Bac-Ninh.json" },
        { id: "CaMau", name: "Tỉnh Cà Mau", file: "./geojson/Ca-Mau.json" },
        { id: "CaoBang", name: "Tỉnh Cao Bằng", file: "./geojson/Cao-Bang.json" },
        { id: "DakLak", name: "Tỉnh Dak Lak", file: "./geojson/Dak-Lak.json" },
        { id: "DienBien", name: "Tỉnh Điện Biên", file: "./geojson/Dien-Bien.json" },
        { id: "DongThap", name: "Tỉnh Đồng Tháp", file: "./geojson/Dong-Thap.json" },
        { id: "GiaLai", name: "Tỉnh Gia Lai", file: "./geojson/Gia-Lai.json" },
        { id: "HaTinh", name: "Tỉnh Hà Tĩnh", file: "./geojson/Ha-Tinh.json" },
        { id: "HungYen", name: "Tỉnh Hưng Yên", file: "./geojson/Hung-Yen.json" },
        { id: "KhanhHoa", name: "Tỉnh Khánh Hòa", file: "./geojson/Khanh-Hoa.json" },
        { id: "LaiChau", name: "Tỉnh Lai Châu", file: "./geojson/Lai-Chau.json" },
        { id: "LamDong", name: "Tỉnh Lâm Đồng", file: "./geojson/Lam-Dong.json" },
        { id: "LangSon", name: "Tỉnh Lạng Sơn", file: "./geojson/Lang-Son.json" },
        { id: "LaoCai", name: "Tỉnh Lào Cai", file: "./geojson/Lao-Cai.json" },
        { id: "NgheAn", name: "Tỉnh Nghệ An", file: "./geojson/Nghe-An.json" },
        { id: "NinhBinh", name: "Tỉnh Ninh Bình", file: "./geojson/Ninh_Binh.json" },
        { id: "PhuTho", name: "Tỉnh Phú Thọ", file: "./geojson/Phu-Tho.json" },
        { id: "QuangNgai", name: "Tỉnh Quảng Ngãi", file: "./geojson/Quang-Ngai.json" },
        { id: "QuangNinh", name: "Tỉnh Quảng Ninh", file: "./geojson/Quang-Ninh.json" },
        { id: "QuangTri", name: "Tỉnh Quảng Trị", file: "./geojson/Quang-Tri.json" },
        { id: "SonLa", name: "Tỉnh Sơn La", file: "./geojson/Son-La.json" },
        { id: "TPCanTho", name: "Thành Phố Cần Thơ", file: "./geojson/TP-Can-Tho.json" },
        { id: "TPDaNang", name: "Thành Phố Đà Nẵng", file: "./geojson/TP-Da-Nang.json" },
        { id: "TPDongNai", name: "Thành Phố Đồng Nai", file: "./geojson/TP-Dong-Nai.json" },
        { id: "TPHaNoi", name: "Thành Phố Hà Nội", file: "./geojson/TP-Ha-Noi.json" },
        { id: "TPHaiPhong", name: "Thành Phố Hải Phòng", file: "./geojson/TP-Hai-Phong.json" },
        { id: "TPHoChiMinh", name: "Thành Phố Hồ Chí Minh", file: "./geojson/TP-Ho-Chi-Minh.json" },
        { id: "TPHue", name: "Thành Phố Huế", file: "./geojson/TP-Hue.json" },
        { id: "TayNinh", name: "Tỉnh Tây Ninh", file: "./geojson/Tay-Ninh.json" },
        { id: "ThaiNguyen", name: "Tỉnh Thái Nguyên", file: "./geojson/Thai-Nguyên.json" },
        { id: "ThanhHoa", name: "Tỉnh Thanh Hóa", file: "./geojson/Thanh-Hoa.json" },
        { id: "TuyenQuang", name: "Tỉnh Tuyên Quang", file: "./geojson/Tuyen-Quang.json" },
        { id: "VinhLong", name: "Tỉnh Vĩnh Long", file: "./geojson/Vinh-Long.json" },
    ],

    // URL của Google Apps Script để lấy dữ liệu thửa đất
    SHEET_DATA_URL: 'https://script.google.com/macros/s/AKfycbz87dcUkndM5w5BeFqUFYJt8JDEcPu98IH5mbzNdov_6eXTNUEhIiknFQ9P7H2c0ZQE/exec',

    // Cấu hình giao diện bản đồ kết hợp: Nền vệ tinh thuần túy (không nhãn) + Lớp phủ bản đồ đường/nhãn từ OSM
    MAP_STYLE: {
        'version': 8, /* Phiên bản định dạng cấu hình style của MapLibre GL */
        'sources': {
            // 1. Nguồn ảnh vệ tinh thuần túy của Google (Dùng tham số lyrs=s để loại bỏ hoàn toàn chữ/nhãn dán của Google)
            'google-satellite-no-label': {
                'type': 'raster',
                'tiles': ['https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'],
                'tileSize': 256,
                'maxzoom': 22
            },
            // 2. Nguồn chuyên dụng chỉ lấy các nhãn tên đường, tên phường xã, ranh giới từ dữ liệu OpenStreetMap (nền trong suốt)
            'osm-labels-overlay': {
                'type': 'raster',
                'tiles': [
                    // Sử dụng tiles của CartoDB (Light Labels Only) để có font chữ đẹp, rõ ràng, nền trong suốt
                    'https://a.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}@2x.png',
                    // Dự phòng thêm nguồn B (nếu nguồn A lỗi)
                    // 'https://b.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}@2x.png'
                ],
                'tileSize': 256,
                'maxzoom': 20,
                'attribution': '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            }
        },
        'layers': [
            // Lớp 1: Nền ảnh vệ tinh nằm dưới cùng (Sắc nét 100%)
            {
                'id': 'google-satellite-layer',
                'type': 'raster',
                'source': 'google-satellite-no-label',
                'minzoom': 0,
                'maxzoom': 22
            },
            // Lớp 2: Chỉ hiển thị tên đường, tên phường xã, địa danh từ OSM nổi lên trên nền vệ tinh
            {
                'id': 'osm-labels-overlay-layer',
                'type': 'raster',
                'source': 'osm-labels-overlay',
                'minzoom': 0,
                'maxzoom': 22,
                'paint': {
                    'raster-opacity': 1.0 // Độ hiển thị rõ nét của chữ OSM (1.0 tương đương 100% để chữ nổi bật trên nền vệ tinh phức tạp)
                }
            }
        ]
    },

    MAP_CENTER: [105.15, 9.18],              /* Tọa độ trung tâm mặc định khởi tạo ban đầu [Kinh độ, Vĩ độ] (Khu vực Cà Mau) */
    MAP_ZOOM: 12,                            /* Mức độ phóng to (zoom level) mặc định */
    FILL_COLOR: '#00ffcc',                   /* Màu tô nền mặc định cho các thửa đất/vùng chọn */
    FILL_OPACITY: 0.3,                       /* Độ trong suốt của lớp màu tô nền (0.3 tương đương 30%) */
    OUTLINE_COLOR: '#ffffff'                 /* Màu đường viền bao quanh thửa đất (màu trắng) */
};

// Biểu thức quy tắc phân loại màu sắc quy hoạch dựa theo từng loại đất cụ thể
const COLOR_MATCH_EXPRESSION = [
    'match',                                 /* Hàm so khớp điều kiện của MapLibre Style Specification */
    ['get', 'Loại Đất'],                     /* Lấy giá trị thuộc tính 'Loại Đất' của từng thửa đất từ dữ liệu bản đồ */
    'Đất ở tại đô thị', '#e063ce',           /* Nếu là Đất ở tại đô thị -> Tô màu hồng đậm */
    'Đất ở tại nông thôn', '#cf99c7',        /* Nếu là Đất ở tại nông thôn -> Tô màu hồng nhạt */
    'Đất nuôi trồng thuỷ sản', '#00b4d8',    /* Nếu là Đất nuôi trồng thuỷ sản -> Tô màu xanh dương nhạt */
    'Đất nuôi trồng thủy sản', '#00b4d8',    /* Dự phòng thêm trường hợp sai chính tả dấu/chữ */
    'Đất trồng cây lâu năm', '#519e05',      /* Nếu là Đất trồng cây lâu năm -> Tô màu xanh lá mạ */
    'Đất trồng cây hàng năm khác', '#519e05',/* Nếu là Đất trồng cây hàng năm khác -> Tô màu xanh nõn chuối */
    'Đất trồng lúa', '#f5e753',              /* Nếu là Đất trồng lúa -> Tô màu vàng nhạt */
    'Đất chuyên trồng lúa nước', '#eaac8b',  /* Nếu là Đất chuyên trồng lúa nước -> Tô màu cam đất */
    '#c2b9ab'                                /* Màu mặc định dự phòng nếu loại đất không nằm trong danh sách trên (màu be) */
];
