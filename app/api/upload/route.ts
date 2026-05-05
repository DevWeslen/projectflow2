import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Create unique filename
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase()
    const fileName = `${timestamp}-${safeName}`
    const path = join(uploadDir, fileName)

    // Write file
    console.log(`[UPLOAD_API] Saving file to: ${path}`)
    await writeFile(path, buffer)
    
    // Return the public URL via the files API to avoid 404 in production
    const url = `/api/files/${fileName}`
    
    return NextResponse.json({ 
      success: true, 
      url, 
      name: file.name,
      type: file.type 
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Erro ao processar o upload' }, { status: 500 })
  }
}
