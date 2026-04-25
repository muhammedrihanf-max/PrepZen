/**
 * Simulates a file upload by converting the file to a Data URI.
 * @param _path Ignored in local mode
 * @param file The File or Blob object to convert
 */
export const uploadFile = async (_path: string, file: Blob | File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * No-op in local mode as we don't store separate file objects.
 */
export const deleteFile = async (_path: string): Promise<void> => {
  // No-op
};
