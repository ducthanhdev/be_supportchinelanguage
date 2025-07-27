const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Đăng ký
exports.register = async (req, res) => {
    try {
        const { username, email, password, displayName } = req.body;

        // Kiểm tra dữ liệu đầu vào
        if (!username || !email || !password || !displayName) {
            return res.status(400).json({
                error: 'Thiếu thông tin đăng ký',
                success: false
            });
        }

        // Kiểm tra username đã tồn tại
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({
                error: 'Tên đăng nhập đã tồn tại',
                success: false
            });
        }

        // Kiểm tra email đã tồn tại
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({
                error: 'Email đã được sử dụng',
                success: false
            });
        }

        // Tạo user mới
        const user = new User({
            username,
            email,
            password,
            displayName
        });

        await user.save();

        // Tạo JWT token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                displayName: user.displayName
            }
        });

    } catch (error) {
        console.error('Lỗi đăng ký:', error);
        res.status(500).json({
            error: 'Lỗi server khi đăng ký',
            success: false
        });
    }
};

// Đăng nhập
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Kiểm tra dữ liệu đầu vào
        if (!username || !password) {
            return res.status(400).json({
                error: 'Thiếu thông tin đăng nhập',
                success: false
            });
        }

        // Tìm user theo username hoặc email
        const user = await User.findOne({
            $or: [{ username }, { email: username }]
        });

        if (!user) {
            return res.status(401).json({
                error: 'Tên đăng nhập hoặc mật khẩu không đúng',
                success: false
            });
        }

        // Kiểm tra password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Tên đăng nhập hoặc mật khẩu không đúng',
                success: false
            });
        }

        // Cập nhật lastLogin
        user.lastLogin = new Date();
        await user.save();

        // Tạo JWT token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                displayName: user.displayName
            }
        });

    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        res.status(500).json({
            error: 'Lỗi server khi đăng nhập',
            success: false
        });
    }
};

// Lấy thông tin user hiện tại
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({
                error: 'Không tìm thấy người dùng',
                success: false
            });
        }

        res.json({
            success: true,
            user
        });

    } catch (error) {
        console.error('Lỗi lấy thông tin user:', error);
        res.status(500).json({
            error: 'Lỗi server',
            success: false
        });
    }
};

// Middleware xác thực JWT
exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            error: 'Token không được cung cấp',
            success: false
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({
                error: 'Token không hợp lệ',
                success: false
            });
        }
        req.user = user;
        next();
    });
}; 