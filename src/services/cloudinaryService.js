export const uploadImageToCloudinary = async (file) => {
  try {
    const isVideo = file.type.startsWith('video/');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'community_hero');
    formData.append('cloud_name', 'dqpgf2b24');

    const resourceType = isVideo ? 'video' : 'image';

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/dqpgf2b24/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    const data = await response.json();
    return { url: data.secure_url, type: resourceType };

  } catch (error) {
    console.error('Cloudinary error:', error);
    return null;
  }
};