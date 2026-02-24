export const uploadService = {
  async uploadFile(file: File, taskId: number): Promise<unknown> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('taskId', taskId.toString());

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      // Не устанавливаем Content-Type, браузер сам добавит boundary
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  },
};
