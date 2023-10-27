export const waitForData = async doc => new Promise((resolve, reject) => {
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', async () => {
    const pdfBuffer = Buffer.concat(buffers);
    const pdfBase64 = pdfBuffer.toString('base64');
    resolve(pdfBase64);
  });
  doc.on('error', reject);
});

export const base64ToArrayBuffer = base64Str => {
  console.log('self', self);
  const binaryString = self.atob(base64Str);
  const binaryLen = binaryString.length;
  const bytes = new Uint8Array(binaryLen);

  for (let i = 0; i < binaryLen; i++) {
    const ascii = binaryString.charCodeAt(i);
    bytes[i] = ascii;
  }

  return bytes;
};
