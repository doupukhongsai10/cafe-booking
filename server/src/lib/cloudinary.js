const cloudinary = require('cloudinary').v2;
const logger = require('./logger');

// Cloudinary automatically parses CLOUDINARY_URL from the environment.
// If the URL contains placeholder values, we fall back to a mock image.
const isCloudinaryConfigured =
  process.env.CLOUDINARY_URL &&
  !process.env.CLOUDINARY_URL.includes('my_api_key') &&
  !process.env.CLOUDINARY_URL.includes('my_cloud_name');

async function uploadImageBuffer(buffer, folder = 'cafe-onboarding') {
  if (!isCloudinaryConfigured) {
    logger.warn('Cloudinary URL is not configured. Falling back to a mock café image URL.');
    // Returns a high-quality coffee shop mock image
    return 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80';
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload failed', { error: error.message });
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );
    uploadStream.end(buffer);
  });
}

module.exports = { uploadImageBuffer };
