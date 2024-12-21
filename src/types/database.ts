export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      bookmarks: {
        Row: {
          id: string
          user_id: string
          url: string
          title: string
          description: string | null
          thumbnail: string | null
          tags: string[]
          keywords: string[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          url: string
          title: string
          description?: string | null
          thumbnail?: string | null
          tags?: string[]
          keywords?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          url?: string
          title?: string
          description?: string | null
          thumbnail?: string | null
          tags?: string[]
          keywords?: string[]
          created_at?: string
        }
      }
    }
  }
}