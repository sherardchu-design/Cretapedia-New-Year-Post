import { DIFY_API_KEY, DIFY_BASE_URL } from "../constants";
import { DifyFileUploadResponse, DifyWorkflowResponse } from "../types";

/**
 * Uploads a file to Dify to get a File ID.
 */
export const uploadFileToDify = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("user", "web-client-user"); // Arbitrary user identifier

  const response = await fetch(`${DIFY_BASE_URL}/files/upload`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${DIFY_API_KEY}`,
      // Do not set Content-Type header manually for FormData, browser sets boundary
    },
    body: formData,
  });

  if (!response.ok) {
    let errorMsg = `File upload failed: ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson.message) errorMsg = errorJson.message;
    } catch (e) {
      const text = await response.text();
      if (text) errorMsg += ` ${text}`;
    }
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
    let errorMsg = `Workflow execution failed: ${response.status}`;
    try {
      const errorJson = await response.json();
      // Dify often returns { code: ..., message: ..., status: ... }
      if (errorJson.message) {
        errorMsg = errorJson.message;
      } else {
        errorMsg = JSON.stringify(errorJson);
      }
    } catch (e) {
      const text = await response.text();
      if (text) errorMsg += ` ${text}`;
    }
    throw new Error(errorMsg);
  }

  const result: DifyWorkflowResponse = await response.json();
  
  // Validate outputs
  if (result.data.status === "failed") {
    throw new Error("Workflow reported failure status.");
  }

  if (!result.data.outputs || !result.data.outputs.poster_url) {
     throw new Error("Workflow finished but did not return a poster_url.");
  }

  return result.data.outputs.poster_url;
};