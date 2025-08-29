// No need for stream conversion since multer provides the buffer directly
export const streamToBuffer = (buffer: Buffer): Buffer => {
  return buffer;
};
