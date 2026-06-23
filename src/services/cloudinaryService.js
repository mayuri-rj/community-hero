export const uploadImageToCloudinary = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('upload_preset', 'community_hero');
    formData.append('cloud_name', 'dqpgf2b24');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/dqpgf2b24/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    const data = await response.json();
    return data.secure_url;

  } catch (error) {
    console.error('Cloudinary error:', error);
    return null;
  }
};