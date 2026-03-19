import { NextResponse } from 'next/server'

import dbConnect from '@/db/dbConnect'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const connection = await dbConnect()
    const database = connection.db

    if (!database) {
      throw new Error('MongoDB database handle is unavailable.')
    }

    await database.admin().ping()

    return NextResponse.json({
      ok: true,
      database: database.databaseName,
      message: 'MongoDB connection successful',
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'MongoDB connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
