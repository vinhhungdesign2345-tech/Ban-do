// js/map.js (đoạn click)
map.on('click', layerId, (e) => {
    if (!e.features || !e.features.length) return;

    const props = e.features[0].properties;

    // IN TOÀN BỘ DỮ LIỆU RA CONSOLE ĐỂ KIỂM TRA
    console.log("Dữ liệu khi click:", props);

    // Hiển thị dạng chữ thô trên Popup để xem tên thuộc tính thực sự là gì
    const debugContent = Object.keys(props)
        .map(key => `<b>${key}:</b> ${props[key]}`)
        .join('<br>');

    new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`<div style="max-height:200px; overflow:auto;">${debugContent}</div>`)
        .addTo(map);
});
