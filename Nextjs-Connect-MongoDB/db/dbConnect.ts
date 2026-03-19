/* eslint-disable no-var */
import mongoose from 'mongoose'

declare global {
  var mongoose: {
    conn: mongoose.Connection | null
    promise: Promise<mongoose.Connection> | null
  }
}

const mongoUri = process.env.MONGODB_URI
const mongoDbName = process.env.MONGODB_DB || 'novacart'

function getMongoUri() {
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set.')
  }

  return mongoUri
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function dbConnect(): Promise<mongoose.Connection> {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(getMongoUri(), {
        dbName: mongoDbName,
        bufferCommands: false,
      })
      .then((mongooseInstance) => mongooseInstance.connection)
  }

  try {
    cached.conn = await cached.promise
  } catch (error) {
    cached.promise = null
    throw error
  }

  return cached.conn
}

export default dbConnect
