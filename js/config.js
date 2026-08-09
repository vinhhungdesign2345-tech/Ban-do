// js/config.js

const CONFIG = {
    // --- DANH SÁCH CÁC TỈNH/THÀNH PHỐ VÀ ĐƯỜNG DẪN TỆP TÀI NGUYÊN GEOJSON ---
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
        { id: "TuyenQuang", name: "Tuyên Quang", file: "./geojson/Tuyen-Quang.json" },
        { id: "VinhLong", name: "Vĩnh Long", file: "./geojson/Vinh-Long.json" },
    ],

    // --- ĐƯỜNG DẪN APIS GOOGLE APPS SCRIPT TRUY XUẤT DỮ LIỆU THỬA ĐẤT ---
    SHEET_DATA_URL: 'https://script.google.com/macros/s/AKfycbz87dcUkndM5w5BeFqUFYJt8JDEcPu98IH5mbzNdov_6eXTNUEhIiknFQ9P7H2c0ZQE/exec',

    // --- CẤU HÌNH GIAO DIỆN VÀ LỚP BẢN ĐỒ (MAP STYLE) ---
    MAP_STYLE: {
        'version': 8,                      // Phiên bản cấu trúc Style chuẩn của MapLibre/Mapbox (phiên bản 8)
        'sources': {
            // Định nghĩa nguồn lớp ảnh vệ tinh Google
            'google-satellite': {
                'type': 'raster',          // Kiểu dữ liệu dạng ảnh lưới (raster)
                'tiles': ['https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'], // Đường dẫn mẫu lấy mảnh bản đồ (tiles) kết hợp nhãn giao thông của Google
                'tileSize': 256            // Kích thước tiêu chuẩn của mỗi mảnh ảnh tile là 256x256 pixel
            },
            // Định nghĩa nguồn lớp bản đồ đường phố OpenStreetMap
            'osm-map': { 
                'type': 'raster',          // Kiểu dữ liệu dạng ảnh lưới (raster)
                'tiles': ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], // Đường dẫn lấy mảnh bản đồ từ máy chủ OpenStreetMap chính thức
                'tileSize': 256,           // Kích thước chuẩn mỗi mảnh bản đồ là 256x256 pixel
                'attribution': '&copy; OpenStreetMap contributors' // Dòng thông báo bản quyền tác giả dữ liệu OSM
            },
            // Định nghĩa nguồn dữ liệu không gian hạ tầng điện (tỉnh Cà Mau)
            'ha-tang-dien-source': {
                'type': 'geojson',         // Kiểu dữ liệu định dạng GeoJSON chuẩn
                'data': './geojson/Ca-Mau-ha-tang-dien.json' // Tệp nguồn chứa tọa độ lưới điện hạ tầng
            }
        },
        'layers': [
            // Cấu hình lớp hiển thị bản đồ vệ tinh Google trên bản đồ
            {
                'id': 'google-satellite-layer',
                'type': 'raster',
                'source': 'google-satellite',
                'minzoom': 0, 'maxzoom': 22  // Phạm vi mức zoom hiển thị từ cấp 0 đến cấp 22
            },
            // Cấu hình lớp hiển thị bản đồ đường phố OSM (mặc định ẩn)
            {
                'id': 'osm-layer', 
                'type': 'raster',
                'source': 'osm-map',
                'layout': { 'visibility': 'none' }, // Thuộc tính hiển thị mặc định là ẩn ('none')
                'minzoom': 0, 'maxzoom': 22
            },
            // Cấu hình hiển thị đường dây điện (LineString) thuộc hạ tầng điện
            {
                'id': 'ha-tang-dien-line',
                'type': 'line',                    // Kiểu hiển thị đối tượng dạng đường (Line)
                'source': 'ha-tang-dien-source',
                'filter': ['==', '$type', 'LineString'], // Chỉ lọc lấy các đối tượng hình học dạng đường thẳng/đường gấp khúc
                'minzoom': 0, 'maxzoom': 22,
                'paint': {
                    'line-color': '#ffcc00',       // Màu sắc đường dây điện là màu vàng cam (#ffcc00)
                    'line-width': 1,               // Độ dày nét vẽ đường dây là 1 pixel
                    'line-opacity': 0.5            // Độ mờ trong suốt của đường dây là 50% (0.5)
                }
            },
            // Cấu hình hiển thị các trạm/điểm cột điện (Point) thuộc hạ tầng điện
            {
                'id': 'ha-tang-dien-points',
                'type': 'circle',                  // Kiểu hiển thị đối tượng dạng điểm chấm tròn (Circle)
                'source': 'ha-tang-dien-source',
                'filter': ['==', '$type', 'Point'], // Chỉ lọc lấy các đối tượng hình học dạng điểm đơn lẻ
                'minzoom': 14,                     // Chỉ bắt đầu hiển thị các điểm cột điện khi phóng to từ cấp độ zoom 14 trở lên
                'maxzoom': 22,
                'paint': {
                    'circle-radius': 4,            // Bán kính chấm tròn điểm điện là 4 pixel
                    'circle-color': '#ff0000',     // Màu sắc bên trong chấm tròn là màu đỏ (#ff0000)
                    'circle-stroke-width': 1,      // Độ dày đường viền ngoài chấm tròn là 1 pixel
                    'circle-stroke-color': '#ffffff' // Màu viền ngoài chấm tròn là màu trắng (#ffffff)
                }
            }
        ]
    },

    // --- THÔNG SỐ VỊ TRÍ TRUNG TÂM VÀ MÀU SẮC MẶC ĐỊNH CHO BẢN ĐỒ ---
    MAP_CENTER: [105.15, 9.18],             // Tọa độ trung tâm khởi tạo bản đồ mặc định [Kinh độ, Vĩ độ] tại Cà Mau
    MAP_ZOOM: 12,                           // Mức độ phóng to (zoom) khởi tạo mặc định ban đầu là cấp 12
    FILL_COLOR: '#00ffcc',                  // Màu tô nền mặc định cho thửa đất khi chọn là xanh ngọc sáng
    FILL_OPACITY: 0.3,                      // Độ trong suốt của lớp màu nền thửa đất là 30% (0.3)
    OUTLINE_COLOR: '#ffffff'                // Màu sắc đường viền ranh giới thửa đất mặc định là màu trắng
};

// --- BIỂU THỨC QUY ĐỊNH MÀU SẮC PHÂN LOẠI THEO TỪNG MỤC ĐÍCH SỬ DỤNG ĐẤT ---
const COLOR_MATCH_EXPRESSION = [
    'match',                                // Câu lệnh điều kiện khớp giá trị (match) trong MapLibre Style Spec
    ['get', 'Loại Đất'],                    // Lấy giá trị thuộc tính 'Loại Đất' của từng thửa đất
    'Đất ở tại đô thị', '#e063ce',          // Nếu là đất ở đô thị -> tô màu hồng tím (#e063ce)
    'Đất ở tại nông thôn', '#cf99c7',        // Nếu là đất ở nông thôn -> tô màu hồng nhạt (#cf99c7)
    'Đất nuôi trồng thuỷ sản', '#00b4d8',   // Nếu là đất nuôi trồng thủy sản (chuẩn chính tả 1) -> tô màu xanh dương nhạt (#00b4d8)
    'Đất nuôi trồng thủy sản', '#00b4d8',   // Nếu là đất nuôi trồng thủy sản (chuẩn chính tả 2) -> tô màu xanh dương nhạt (#00b4d8)
    'Đất trồng cây lâu năm', '#519e05',     // Nếu là đất trồng cây lâu năm -> tô màu xanh lá cây (#519e05)
    'Đất trồng cây hàng năm khác', '#519e05', // Nếu là đất trồng cây hàng năm khác -> tô màu xanh lá cây (#519e05)
    'Đất trồng lúa', '#f5e753',             // Nếu là đất trồng lúa -> tô màu vàng lúa chín sáng (#f5e753)
    'Đất chuyên trồng lúa nước', '#ffea00', // Nếu là đất chuyên trồng lúa nước -> tô màu vàng đậm (#ffea00)
    '#c2b9ab'                               // Màu mặc định dự phòng cho các loại đất khác chưa được định nghĩa (màu xám cát)
];
