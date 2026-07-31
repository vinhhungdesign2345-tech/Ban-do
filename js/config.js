// js/config.js
const CONFIG = {
    PROVINCES: [
        { id: "CaMau", name: "Cà Mau", file: "./geojson/Ca-Mau.geojson", center: [105.15, 9.18] }
    ],
};

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
