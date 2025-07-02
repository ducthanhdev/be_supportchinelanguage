# SupportChineseLanguage Backend

Backend API cho ứng dụng quản lý từ vựng tiếng Trung - Hán Việt.

## Công nghệ sử dụng
- Node.js
- Express.js
- MongoDB (Mongoose)
- dotenv
- pinyin, google-translate-api

## Cài đặt

```bash
cd be
npm install
```

## Cấu hình môi trường
Tạo file `.env` trong thư mục `be/` với nội dung:

```
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/dbname
PORT=5000
LIBRE_API_KEY=your_key (nếu dùng)
```

## Chạy server

```bash
npm start        # Chạy production
npm run dev      # Chạy development với nodemon
```

Server mặc định chạy ở `http://localhost:5000`

## Cấu trúc thư mục
- `controllers/`  : Xử lý logic API
- `models/`       : Định nghĩa schema MongoDB
- `routes/`       : Định nghĩa các endpoint
- `libs/`         : Thư viện xử lý đặc biệt (Hán Việt)

## API Endpoints

### Word
- `POST   /api/words`         : Thêm từ mới
- `GET    /api/words`         : Lấy danh sách từ (có phân trang, tìm kiếm)
- `PUT    /api/words/:id`     : Sửa từ
- `DELETE /api/words/:id`     : Xóa từ

### Example
- `GET    /api/example?word=xxx` : Lấy ví dụ cho 1 từ
- `POST   /api/example`          : Lấy ví dụ cho nhiều từ (body: `{ words: ["中", "国"] }`)

### HanViet
- `PUT    /api/hanviet`          : Cập nhật nghĩa Hán Việt cho 1 ký tự (body: `{ char, hanviet }`)

## Ghi chú
- Đảm bảo MongoDB đã chạy và đúng URI.
- Có thể deploy lên VPS, Heroku, Render, Railway...
- Đổi PORT nếu cần.

## License
MIT 