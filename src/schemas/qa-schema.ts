import type { CollectionSchema } from 'deepspace/schema'

export const roomsSchema: CollectionSchema = {
  name: 'rooms',
  columns: [
    { name: 'title', storage: 'text', interpretation: 'plain' },
    { name: 'code', storage: 'text', interpretation: 'plain' },
  ],
  permissions: {
    viewer: { read: true, create: false, update: false, delete: false },
    member: { read: true, create: true, update: 'own', delete: 'own' },
    admin: { read: true, create: true, update: true, delete: true },
  },
}

export const questionsSchema: CollectionSchema = {
  name: 'questions',
  columns: [
    { name: 'roomCode', storage: 'text', interpretation: 'plain' },
    { name: 'text', storage: 'text', interpretation: 'plain' },
    { name: 'authorName', storage: 'text', interpretation: 'plain' },
    { name: 'status', storage: 'text', interpretation: 'plain' },
  ],
  permissions: {
    viewer: { read: true, create: false, update: false, delete: false },
    member: { read: true, create: true, update: 'own', delete: 'own' },
    admin: { read: true, create: true, update: true, delete: true },
  },
}

export const votesSchema: CollectionSchema = {
  name: 'votes',
  columns: [
    { name: 'questionId', storage: 'text', interpretation: 'plain' },
    { name: 'roomCode', storage: 'text', interpretation: 'plain' },
  ],
  permissions: {
    viewer: { read: true, create: false, update: false, delete: false },
    member: { read: true, create: true, update: false, delete: 'own' },
    admin: { read: true, create: true, update: true, delete: true },
  },
}

export const moderationSchema: CollectionSchema = {
  name: 'moderation',
  columns: [
    { name: 'questionId', storage: 'text', interpretation: 'plain' },
    { name: 'roomCode', storage: 'text', interpretation: 'plain' },
    { name: 'action', storage: 'text', interpretation: 'plain' },
  ],
  permissions: {
    viewer: { read: true, create: false, update: false, delete: false },
    member: { read: true, create: true, update: false, delete: 'own' },
    admin: { read: true, create: true, update: true, delete: true },
  },
}
