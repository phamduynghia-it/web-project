const CONFIG = {
    // 1. Thông tin màn hình khoá
    sender: `__SENDER__`,           // Tên người gửi
    recipient: `__RECIPIENT__`,       // Tên người nhận
    pinCode: `__PINCODE__`,            // Mật khẩu 4 số để mở khoá thiệp

    // 2. Nội dung thiệp
    title: `__TITLE__`,        // Tiêu đề chính (hiển thị trên vỏ thiệp và popup thư)
    cardCoverDeco: `__CARDCOVERDECO__`,      // Dòng trang trí nhỏ phía trên tiêu đề
    forYouLine: `__FORYOULINE__`, // Dòng chữ hiển thị khi hoa rơi

    // 3. Nội dung bức thư (Mỗi dòng là một đoạn văn)
    popupMessage: `__POPUPMESSAGE__`.split('\n'),

    // 4. Hình ảnh (Lưu ảnh vào thư mục images/ và điền tên file vào đây)
    images: __IMAGES__,

    // 5. Ảnh nổi bật hiển thị bên trong bức thư
    popupPhoto: `__POPUPPHOTO__`, 

    // 6. Nhạc nền (Link file MP3)
    music: `__MUSIC__`,
};

