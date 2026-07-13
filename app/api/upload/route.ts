import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Create unique filename
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase()
    const fileName = `uploads/${timestamp}-${safeName}`

    // Upload to Vercel Blob Storage (cloud, persistent)
    const blob = await put(fileName, file, {
      access: 'public',
    })

    return NextResponse.json({
      success: true,
      url: blob.url,
      name: file.name,
      type: file.type
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Erro ao processar o upload' }, { status: 500 })
  }
}
