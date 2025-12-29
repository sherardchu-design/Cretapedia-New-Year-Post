import { DIFY_API_KEY, DIFY_BASE_URL } from "../constants.ts";
import { DifyFileUploadResponse, DifyWorkflowResponse } from "../types.ts";

/**
 * Compresses the image on client side before upload.
 * Reduces dimensions and quality to ensure it fits Dify's limits.
 */
export const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_size = 1200; // Limit long side to 1200px

        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('图片压缩失败'));
          }
        }, 'image/jpeg', 0.85); // High enough quality but much smaller file size
      };
      img.onerror = () => reject(new Error('图片加载失败'));
    };
    reader.onerror = () => reject(new Error('读取文件失败'));
  });
};

/**
 * Uploads a file to Dify to get a File ID.
 */
export const uploadFileToDify = async (file: File): Promise<string> => {
  // Always compress before upload to fix desktop large file issue
  const compressedFile = await compressImage(file).catch(() => file);
  
  const formData = new FormData();
  formData.append("file", compressedFile);
  formData.append("user", "web-client-user");

  const response = await fetch(`${DIFY_BASE_URL}/files/upload`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${DIFY_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    let errorMsg = `文件上传失败 (Status: ${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson.message) errorMsg = errorJson.message;
    } catch (e) {}
    throw new Error(errorMsg);
  }

  const data: DifyFileUploadResponse = await response.json();
  return data.id;
};

/**
 * Runs the Dify Workflow.
 */
export const runDifyWorkflow = async (
  fileId: string,
  characterName: string
): Promise<string> => {
  const payload = {
    inputs: {
      ip_name: characterName,
      user_image: {
        type: "image",
        transfer_method: "local_file",
        upload_file_id: fileId,
      },
    },
    response_mode: "blocking",
    user: "web-client-user-" + Date.now(),
  };

  const response = await fetch(`${DIFY_BASE_URL}/workflows/run`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${DIFY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("生成请求失败，请稍后重试。");
  }

  const result: DifyWorkflowResponse = await response.json();
  
  if (result.data.status === "failed") {
    throw new Error(result.data.error || "工作流执行失败。");
  }

  if (!result.data.outputs || !result.data.outputs.poster_url) {
     throw new Error("AI 未能返回海报链接，请尝试更换照片。");
  }

  return result.data.outputs.poster_url;
};