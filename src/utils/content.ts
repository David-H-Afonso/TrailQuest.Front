export const contentAsset = (id: string, file: string) => `/api/v1/content/${encodeURIComponent(id)}/${encodeURIComponent(file)}`;
