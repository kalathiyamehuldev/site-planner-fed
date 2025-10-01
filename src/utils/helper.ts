
// Utility function for formatting file size
export const formatFileSize = (bytes: number | string): string => {
  const size = typeof bytes === 'string' ? parseInt(bytes) : bytes;
  if (size === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(size) / Math.log(k));
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Utility function for formatting file type
export const formatFileType = (type: string): string => {
  if (!type) return 'Unknown';
  
  const typeMap: { [key: string]: string } = {
    'pdf': 'PDF',
    'docx': 'Word',
    'doc': 'Word',
    'xlsx': 'Excel',
    'xls': 'Excel',
    'pptx': 'PowerPoint Presentation',
    'ppt': 'PowerPoint Presentation',
    'jpg': 'JPEG',
    'jpeg': 'JPEG',
    'png': 'PNG',
    'gif': 'GIF',
    'zip': 'ZIP Archive',
    'rar': 'RAR Archive',
    'txt': 'Text File'
  };
  
  return typeMap[type.toLowerCase()] || type.toUpperCase() + ' File';
};