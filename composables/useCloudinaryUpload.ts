import {
  getDownloadURL,
  ref as storageRef,
  uploadBytesResumable,
  type UploadTaskSnapshot,
} from 'firebase/storage'

import type { CompressOptions, CompressedImage } from '~/utils/compressImage'

export interface CloudinaryUploadResult {
  url: string
  publicId: string
  width: number
  height: number
  format: string
  bytes: number
  compression: CompressedImage
}

export interface UploadOptions {
  folder?: string
  maxBytes?: number
  compress?: boolean | CompressOptions
}

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024
const MAX_INPUT_BYTES = 25 * 1024 * 1024

function mb(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')}MB`
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-')
}

async function memberPhotoDataUrl(file: File): Promise<{
  url: string
  width: number
  height: number
  bytes: number
}> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Apenas imagens JPG, PNG ou WEBP são permitidas.')
  }

  return await new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(new Error('Não foi possível ler a fotografia.'))

    reader.onload = () => {
      const img = new Image()

      img.onerror = () => reject(new Error('Não foi possível processar a fotografia.'))

      img.onload = () => {
        const MAX = 480

        let width = img.width
        let height = img.height

        if (width > height && width > MAX) {
          height = Math.round((height * MAX) / width)
          width = MAX
        } else if (height > MAX) {
          width = Math.round((width * MAX) / height)
          height = MAX
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('O navegador não conseguiu processar a fotografia.'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        let quality = 0.72
        let url = canvas.toDataURL('image/jpeg', quality)

        // Mantém a fotografia pequena para não ultrapassar
        // o limite do documento Firestore.
        while (url.length > 220_000 && quality > 0.35) {
          quality -= 0.08
          url = canvas.toDataURL('image/jpeg', quality)
        }

        if (url.length > 300_000) {
          reject(new Error('A fotografia continua muito grande. Escolha uma imagem menor.'))
          return
        }

        resolve({
          url,
          width,
          height,
          bytes: Math.round((url.length * 3) / 4),
        })
      }

      img.src = String(reader.result)
    }

    reader.readAsDataURL(file)
  })
}

export function useCloudinaryUpload() {
  const nuxt = useNuxtApp()

  const uploading = ref(false)
  const compressing = ref(false)
  const progress = ref(0)
  const error = ref<string | null>(null)
  const compression = ref<CompressedImage | null>(null)

  function validateInput(file: File) {
    if (!file.type.startsWith('image/')) {
      throw new Error('Apenas ficheiros de imagem são permitidos.')
    }

    if (file.size > MAX_INPUT_BYTES) {
      throw new Error(
        `A imagem é muito grande. Escolha uma imagem com menos de ${mb(MAX_INPUT_BYTES)}.`
      )
    }
  }

  async function upload(file: File, options: UploadOptions = {}): Promise<CloudinaryUploadResult> {
    const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES

    const folder = options.folder?.replace(/^\/+|\/+$/g, '') || 'uploads'

    const compressOption = options.compress ?? true

    uploading.value = true
    compressing.value = false
    progress.value = 0
    error.value = null
    compression.value = null

    try {
      validateInput(file)

      // Fotos de membros não dependem de Cloudinary nem Firebase Storage.
      // São reduzidas para avatar e guardadas diretamente no documento do membro.
      if (folder === 'members') {
        compressing.value = true

        try {
          const avatar = await memberPhotoDataUrl(file)

          progress.value = 100

          const localCompression: CompressedImage = {
            file,
            originalBytes: file.size,
            bytes: avatar.bytes,
            width: avatar.width,
            height: avatar.height,
            skipped: false,
          }

          compression.value = localCompression

          return {
            url: avatar.url,
            publicId: 'member-avatar-inline',
            width: avatar.width,
            height: avatar.height,
            format: 'jpeg',
            bytes: avatar.bytes,
            compression: localCompression,
          }
        } finally {
          compressing.value = false
        }
      }

      let result: CompressedImage

      if (compressOption === false) {
        result = {
          file,
          originalBytes: file.size,
          bytes: file.size,
          width: 0,
          height: 0,
          skipped: true,
          reason: 'disabled',
        }
      } else {
        compressing.value = true

        try {
          result = await compressImage(file, compressOption === true ? {} : compressOption)
        } finally {
          compressing.value = false
        }
      }

      compression.value = result

      if (result.file.size > maxBytes) {
        throw new Error(`A imagem deve ter menos de ${mb(maxBytes)} após a compressão.`)
      }

      const extension = result.file.name.split('.').pop()?.toLowerCase() || 'jpg'

      const unique =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`

      const filename = safeFileName(`${unique}-${result.file.name}`)

      const path = `${folder}/${filename}`

      const fileRef = storageRef(nuxt.$storage, path)

      const task = uploadBytesResumable(fileRef, result.file, {
        contentType: result.file.type || 'image/jpeg',
      })

      const snapshot = await new Promise<UploadTaskSnapshot>((resolve, reject) => {
        task.on(
          'state_changed',
          (snap) => {
            progress.value =
              snap.totalBytes > 0 ? Math.round((snap.bytesTransferred / snap.totalBytes) * 100) : 0
          },
          reject,
          () => resolve(task.snapshot)
        )
      })

      const url = await getDownloadURL(snapshot.ref)

      progress.value = 100

      return {
        url,
        publicId: path,
        width: result.width,
        height: result.height,
        format: extension,
        bytes: result.file.size,
        compression: result,
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Não foi possível carregar a imagem.'

      throw e
    } finally {
      uploading.value = false
      compressing.value = false
    }
  }

  function reset() {
    uploading.value = false
    compressing.value = false
    progress.value = 0
    error.value = null
    compression.value = null
  }

  return {
    upload,
    reset,
    uploading,
    compressing,
    progress,
    error,
    compression,
  }
}
