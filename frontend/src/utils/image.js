// Resizes and center-crops an image file to a JPEG data URL small enough to
// store directly on a database record (no Storage bucket needed).
export function resizeImageToDataUrl(file, { width, height, quality = 0.78 }) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file."));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const scale = Math.max(width / img.width, height / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      canvas.getContext("2d").drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image."));
    };
    img.src = url;
  });
}

// Student profile photo: a 256x300 portrait, small enough for the student record.
export function fileToPhoto(file, width = 256, height = 300) {
  return resizeImageToDataUrl(file, { width, height, quality: 0.8 });
}
