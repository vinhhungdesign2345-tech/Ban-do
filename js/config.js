// js/config.js
const CONFIG = {
    // Danh sách Tỉnh/Thành phố hỗ trợ
    PROVINCES: [
        { id: "CaMau", name: "Cà Mau", file: "./geojson/Ca-Mau.geojson", center: [105.15, 9.18] }
    ],

    // URL Google Apps Script Web App
    SHEET_DATA_URL: 'https://script.google.com/macros/s/AKfycbz87dcUkndM5w5BeFqUFYJt8JDEcPu98IH5mbzNdov_6eXTNUEhIiknFQ9P7H2c0ZQE/exec',

    // Nền bản đồ Google Vệ tinh
    MAP_STYLE: {
        'version': 8,
        'sources': {
            'google-satellite': {
                'type': 'raster',
                'tiles': ['https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'],
                'tileSize': 256
            }
        },
        'layers': [
            {
                'id': 'google-satellite-layer',
                'type': 'raster',
                'source': 'google-satellite',
                'minzoom': 0,
                'maxzoom': 22
            }
        ]
    },

    MAP_CENTER: [105.15, 9.18],
    MAP_ZOOM: 12,
    FILL_COLOR: '#00ffcc',
    FILL_OPACITY: 0.3,
    OUTLINE_COLOR: '#ffffff'
};

// Bảng màu quy hoạch dùng chung cho các lớp dữ liệu
const COLOR_MATCH_EXPRESSION = [
    'match',
    ['get', 'Loại Đất'],
    'Đất ở tại đô thị', '#ff007f',
    'Đất ở tại nông thôn', '#ff5400',
    'Đất nuôi trồng thuỷ sản', '#00b4d8',
    'Đất nuôi trồng thủy sản', '#00b4d8',
    'Đất trồng cây lâu năm', '#70e000',
    'Đất trồng cây hàng năm khác', '#9ef01a',
    'Đất trồng lúa', '#f5e753',
    'Đất chuyên trồng lúa nước', '#ffea00',
    '#ff9e00'
];
