/**
 * Renders an image URL to a cropped, scaled JPEG File ready for upload.
 * Uses a two-canvas pipeline: the first canvas applies rotation/flip transforms,
 * the second slices the exact pixel crop region and scales it to ≤500×500.
 * drawImage stays in GPU memory and is faster than getImageData → putImageData.
 *
 * @param {string} imageSrc - Object URL or data URL of the source image
 * @param {{ x, y, width, height }} pixelCrop - Pixel coordinates from react-easy-crop
 * @param {number} [rotation=0] - Rotation in degrees
 * @param {{ horizontal: boolean, vertical: boolean }} [flip]
 * @returns {Promise<File>} - Cropped JPEG File named with a timestamp
 */
export const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image()
        image.addEventListener('load', () => resolve(image))
        image.addEventListener('error', (error) => reject(error))
        image.setAttribute('crossOrigin', 'anonymous')
        image.src = url
    })

export function getRadianAngle(degreeValue) {
    return (degreeValue * Math.PI) / 180
}

export function rotateSize(width, height, rotation) {
    const rotRad = getRadianAngle(rotation)
    return {
        width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    }
}

export default async function getCroppedImg(
    imageSrc,
    pixelCrop,
    rotation = 0,
    flip = { horizontal: false, vertical: false }
) {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
        return null
    }

    const rotRad = getRadianAngle(rotation)

    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
        image.width,
        image.height,
        rotation
    )

    canvas.width = bBoxWidth
    canvas.height = bBoxHeight

    ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
    ctx.rotate(rotRad)
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
    ctx.translate(-image.width / 2, -image.height / 2)

    ctx.drawImage(image, 0, 0)

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = pixelCrop.width;
    croppedCanvas.height = pixelCrop.height;
    const croppedCtx = croppedCanvas.getContext('2d');

    croppedCtx.drawImage(
        canvas,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    const MAX_DIMENSION = 500;
    let finalWidth = pixelCrop.width;
    let finalHeight = pixelCrop.height;

    if (finalWidth > MAX_DIMENSION || finalHeight > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / finalWidth, MAX_DIMENSION / finalHeight);
        finalWidth = Math.round(finalWidth * ratio);
        finalHeight = Math.round(finalHeight * ratio);
    }

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = finalWidth;
    finalCanvas.height = finalHeight;
    const finalCtx = finalCanvas.getContext('2d');

    // White fill handles transparent PNGs — toBlob('image/jpeg') has no alpha channel
    finalCtx.fillStyle = '#ffffff';
    finalCtx.fillRect(0, 0, finalWidth, finalHeight);

    finalCtx.drawImage(croppedCanvas, 0, 0, pixelCrop.width, pixelCrop.height, 0, 0, finalWidth, finalHeight);

    return new Promise((resolve, reject) => {
        finalCanvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('Canvas is empty'));
                return;
            }
            const fileName = `profile-${Date.now()}.jpg`;
            blob.name = fileName;
            // Construct a File (not just a Blob) so Multer receives the filename and MIME type
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            resolve(file);
        }, 'image/jpeg', 0.90);
    });
}
