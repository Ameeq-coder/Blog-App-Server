const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: 'dk0kdyq1y',
    api_key: '238825583334856',
    api_secret: 'eMhtP2CpSwvd6Q0457J7_JkwQ3E',
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'blog_posts', // Folder name in Cloudinary
        allowedFormats: ['jpg', 'png'],
    },
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };
