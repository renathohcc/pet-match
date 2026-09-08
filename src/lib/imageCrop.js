/**
 * Recorta uma imagem (via <canvas>) de acordo com a área retornada pelo
 * react-easy-crop e devolve um File JPEG pronto pra upload.
 */
export function getCroppedImageFile(imageSrc, cropPixels, fileName = 'avatar.jpg') {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = cropPixels.width
      canvas.height = cropPixels.height
      const ctx = canvas.getContext('2d')

      ctx.drawImage(
        img,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        cropPixels.width,
        cropPixels.height
      )

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Não foi possível processar a imagem.'))
            return
          }
          resolve(new File([blob], fileName, { type: 'image/jpeg' }))
        },
        'image/jpeg',
        0.92
      )
    }
    img.onerror = () => reject(new Error('Não foi possível carregar a imagem.'))
    img.src = imageSrc
  })
}
