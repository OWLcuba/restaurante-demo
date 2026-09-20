export async function processImage(file, options = {}) {
    const {
        maxWidth = 1600,
        maxHeight = 1600,
        quality = 0.82,
        mimeType = "image/jpeg"
    } = options

    if (!file) {
        throw new Error("No se recibió ninguna imagen.")
    }

    if (!file.type?.startsWith("image/")) {
        throw new Error("El archivo seleccionado no es una imagen.")
    }

    const imageBitmap =
        await createImageBitmap(file)

    const originalWidth =
        imageBitmap.width

    const originalHeight =
        imageBitmap.height

    let targetWidth =
        originalWidth

    let targetHeight =
        originalHeight

    const widthRatio =
        maxWidth / originalWidth

    const heightRatio =
        maxHeight / originalHeight

    const scale =
        Math.min(
            1,
            widthRatio,
            heightRatio
        )

    targetWidth =
        Math.round(
            originalWidth * scale
        )

    targetHeight =
        Math.round(
            originalHeight * scale
        )

    const canvas =
        document.createElement("canvas")

    canvas.width =
        targetWidth

    canvas.height =
        targetHeight

    const context =
        canvas.getContext("2d")

    if (!context) {
        throw new Error(
            "No se pudo procesar la imagen."
        )
    }

    context.drawImage(
        imageBitmap,
        0,
        0,
        targetWidth,
        targetHeight
    )

    imageBitmap.close()

    const blob =
        await new Promise(
            (
                resolve,
                reject
            ) => {
                canvas.toBlob(
                    (result) => {
                        if (!result) {
                            reject(
                                new Error(
                                    "No se pudo convertir la imagen."
                                )
                            )

                            return
                        }

                        resolve(result)
                    },
                    mimeType,
                    quality
                )
            }
        )

    const baseName =
        String(
            file.name || "imagen"
        )
            .replace(
                /\.[^/.]+$/,
                ""
            )
            .replace(
                /[^a-zA-Z0-9-_]+/g,
                "-"
            )
            .replace(
                /^-+|-+$/g,
                ""
            ) || "imagen"

    const extension =
        mimeType === "image/webp"
            ? "webp"
            : "jpg"

    return new File(
        [blob],
        `${baseName}.${extension}`,
        {
            type: mimeType,
            lastModified:
                Date.now()
        }
    )
}